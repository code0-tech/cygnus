import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"
import type { AppLocale } from "@/lib/i18n"

type CheckoutErrorBody = { details?: unknown; error?: unknown; errorCode?: unknown }
export type CheckoutSubmissionErrorKind = "customer" | "session" | "tax"

export class CheckoutSubmissionError extends Error {
    constructor(
        readonly kind: CheckoutSubmissionErrorKind,
        readonly errorCode: string | null,
        message: string,
        readonly status: number | null = null,
        readonly retryAfterSeconds: number | null = null
    ) {
        super(message)
        this.name = "CheckoutSubmissionError"
    }
}

export interface CheckoutSessionData {
    clientSecret: string
    expiresAt: number | null
    id: string | null
}
export interface CheckoutCustomerData {
    customerType: CraterCustomerType
    email: string | null
    id: string
    name: string | null
}

export interface CheckoutTaxQuoteData {
    amountTotal: number
    currency: string
    taxAmountExclusive: number
}

export interface CheckoutStripePricingData {
    currency: string
    discountAmount: number
    subtotalPrice: number
    taxAmount: number
    totalPrice: number
}

async function readCheckoutError(response: Response, fallback: string) {
    try {
        const body = (await response.json()) as CheckoutErrorBody
        const error = typeof body.error === "string" ? body.error : fallback
        const errorCode = typeof body.errorCode === "string" ? body.errorCode : null
        const details = Array.isArray(body.details) ? body.details.filter((detail): detail is string => typeof detail === "string") : []
        return { errorCode, message: [error, ...(errorCode ? [`(${errorCode})`] : []), ...details].join(" ") }
    } catch {
        return { errorCode: null, message: fallback }
    }
}

async function createCheckoutSubmissionError(response: Response, fallback: string, kind: CheckoutSubmissionErrorKind) {
    const error = await readCheckoutError(response, fallback)
    const retryAfterHeader = response.headers.get("Retry-After")
    const retryAfterSeconds = retryAfterHeader && /^\d+$/.test(retryAfterHeader) ? Number.parseInt(retryAfterHeader, 10) : null
    return new CheckoutSubmissionError(kind, error.errorCode, error.message, response.status, retryAfterSeconds)
}

function parseCheckoutCustomer(value: unknown): CheckoutCustomerData | null {
    if (!value || typeof value !== "object" || !("id" in value) || typeof value.id !== "string" || !("customerType" in value)) return null
    if (value.customerType !== "business" && value.customerType !== "personal") return null

    return {
        customerType: value.customerType,
        email: "email" in value && typeof value.email === "string" ? value.email : null,
        id: value.id,
        name: "name" in value && typeof value.name === "string" ? value.name : null,
    }
}

export async function getCheckoutCustomers() {
    const customers: CheckoutCustomerData[] = []
    const seenCursors = new Set<string>()
    let after: string | null = null

    do {
        const url = new URL("/api/crater/customer", window.location.origin)
        if (after) url.searchParams.set("after", after)
        const response = await fetch(`${url.pathname}${url.search}`, { credentials: "same-origin" })
        if (!response.ok) throw await createCheckoutSubmissionError(response, "Failed to load billing customers.", "customer")
        const body: unknown = await response.json()
        const source = body && typeof body === "object" ? (body as Record<string, unknown>) : null
        const values = source && Array.isArray(source.customers) ? source.customers : null
        if (!values) throw new CheckoutSubmissionError("customer", null, "Crater returned no customer list.")
        customers.push(...values.map(parseCheckoutCustomer).filter((customer): customer is CheckoutCustomerData => customer !== null))

        const pageInfo = source?.pageInfo && typeof source.pageInfo === "object" ? source.pageInfo : null
        const hasNextPage = Boolean(pageInfo && "hasNextPage" in pageInfo && pageInfo.hasNextPage === true)
        const endCursor = pageInfo && "endCursor" in pageInfo && typeof pageInfo.endCursor === "string" ? pageInfo.endCursor : null
        if (!hasNextPage) break
        if (!endCursor || seenCursors.has(endCursor)) throw new CheckoutSubmissionError("customer", null, "Crater returned an invalid customer cursor.")
        seenCursors.add(endCursor)
        after = endCursor
    } while (after)

    return customers
}

export async function createCheckoutCustomer({ checkoutKey, customerType }: { checkoutKey: string; customerType: CraterCustomerType }) {
    const customerResponse = await fetch("/api/crater/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutKey, customerType, draft: true }),
        credentials: "same-origin",
    })
    if (!customerResponse.ok) throw await createCheckoutSubmissionError(customerResponse, "Failed to create the billing customer.", "customer")
    const customer = parseCheckoutCustomer(await customerResponse.json())
    if (!customer) throw new CheckoutSubmissionError("customer", null, "Crater returned an invalid customer.")
    return customer
}

export async function createCheckoutSession({ customerId, locale, searchParams }: { customerId: string; locale: AppLocale; searchParams: URLSearchParams }) {
    const checkoutResponse = await fetch("/api/crater/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(searchParams.entries()), customerId, locale }),
        credentials: "same-origin",
    })
    if (!checkoutResponse.ok) throw await createCheckoutSubmissionError(checkoutResponse, "Failed to create a Crater checkout session.", "session")
    const checkout: unknown = await checkoutResponse.json()
    if (!checkout || typeof checkout !== "object" || !("clientSecret" in checkout) || typeof checkout.clientSecret !== "string" || !checkout.clientSecret) {
        throw new CheckoutSubmissionError("session", null, "Crater returned no checkout client secret.")
    }

    return {
        clientSecret: checkout.clientSecret,
        expiresAt: "expiresAt" in checkout && typeof checkout.expiresAt === "number" ? checkout.expiresAt : null,
        id: "id" in checkout && typeof checkout.id === "string" ? checkout.id : null,
    } satisfies CheckoutSessionData
}

export async function calculateCheckoutTax({ searchParams }: { searchParams: URLSearchParams }) {
    const taxResponse = await fetch("/api/crater/checkout/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(searchParams.entries())),
        credentials: "same-origin",
    })
    if (!taxResponse.ok) throw await createCheckoutSubmissionError(taxResponse, "Failed to calculate checkout tax.", "tax")

    const taxQuote: unknown = await taxResponse.json()
    if (
        !taxQuote ||
        typeof taxQuote !== "object" ||
        !("amountTotal" in taxQuote) ||
        typeof taxQuote.amountTotal !== "number" ||
        !("currency" in taxQuote) ||
        typeof taxQuote.currency !== "string" ||
        !("taxAmountExclusive" in taxQuote) ||
        typeof taxQuote.taxAmountExclusive !== "number"
    ) {
        throw new CheckoutSubmissionError("tax", null, "Crater returned an invalid tax quote.")
    }

    return {
        amountTotal: taxQuote.amountTotal,
        currency: taxQuote.currency,
        taxAmountExclusive: taxQuote.taxAmountExclusive,
    } satisfies CheckoutTaxQuoteData
}
