import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"
import type { AppLocale } from "@/lib/i18n"

type CheckoutErrorBody = { details?: unknown; error?: unknown; errorCode?: unknown }

export interface CheckoutSessionData {
    clientSecret: string
    expiresAt: number | null
    id: string | null
}

export interface CheckoutTaxQuoteData {
    amountTotal: number
    currency: string
    taxAmountExclusive: number
}

async function readCheckoutError(response: Response, fallback: string) {
    try {
        const body = (await response.json()) as CheckoutErrorBody
        const error = typeof body.error === "string" ? body.error : fallback
        const errorCode = typeof body.errorCode === "string" ? body.errorCode : null
        const details = Array.isArray(body.details) ? body.details.filter((detail): detail is string => typeof detail === "string") : []
        return [error, ...(errorCode ? [`(${errorCode})`] : []), ...details].join(" ")
    } catch {
        return fallback
    }
}

async function createCheckoutCustomer({
    customerType,
}: {
    customerType: CraterCustomerType
}) {
    const customerResponse = await fetch("/api/crater/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerType }),
        credentials: "same-origin",
    })
    if (!customerResponse.ok) throw new Error(await readCheckoutError(customerResponse, "Failed to create the billing customer."))
}

export async function createCheckoutSession({ locale, searchParams }: { locale: AppLocale; searchParams: URLSearchParams }) {
    const checkoutResponse = await fetch("/api/crater/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(searchParams.entries()), locale }),
        credentials: "same-origin",
    })
    if (!checkoutResponse.ok) throw new Error(await readCheckoutError(checkoutResponse, "Failed to create a Crater checkout session."))
    const checkout: unknown = await checkoutResponse.json()
    if (!checkout || typeof checkout !== "object" || !("clientSecret" in checkout) || typeof checkout.clientSecret !== "string" || !checkout.clientSecret) {
        throw new Error("Crater returned no checkout client secret.")
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
    if (!taxResponse.ok) throw new Error(await readCheckoutError(taxResponse, "Failed to calculate checkout tax."))

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
        throw new Error("Crater returned an invalid tax quote.")
    }

    return {
        amountTotal: taxQuote.amountTotal,
        currency: taxQuote.currency,
        taxAmountExclusive: taxQuote.taxAmountExclusive,
    } satisfies CheckoutTaxQuoteData
}

export async function prepareCheckoutSession({
    customerType,
    locale,
    searchParams,
}: {
    customerType: CraterCustomerType
    locale: AppLocale
    searchParams: URLSearchParams
}) {
    await createCheckoutCustomer({ customerType })
    return createCheckoutSession({ locale, searchParams })
}
