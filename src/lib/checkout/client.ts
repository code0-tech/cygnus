import type { StripeCheckoutContact } from "@stripe/stripe-js"
import type { CraterCustomerType } from "@/lib/crater/values"
import type { AppLocale } from "@/lib/i18n"

const INITIAL_POLL_DELAY_MS = 2_000
const MAX_POLL_DELAY_MS = 10_000
const MAX_POLLING_DURATION_MS = 5 * 60_000
const CHECKOUT_STATUS_REQUEST_TIMEOUT_MS = 10_000

export function checkoutFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers)
    const id = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("guestCheckout")
    if (id !== null) headers.set("x-guest-checkout", id)
    return fetch(input, { ...init, headers })
}

export function replaceCheckoutPage(url: string) {
    window.location.replace(url)
}

/**
 * Ends the current Crater session, account or guest. Failures are swallowed: the caller leaves for a login page that
 * does not resume a session while it shows a notice, so a session that survived cannot send the visitor back.
 */
export async function revokeCheckoutSession() {
    try {
        await checkoutFetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
    } catch {
        // See above: the login page stays on the login choice either way.
    }
}

export async function createGuestCheckout(email: string) {
    const response = await checkoutFetch("/api/crater/guest", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        referrerPolicy: "no-referrer",
    })
    if (!response.ok) throw new Error("Could not create a guest checkout.")

    const result: unknown = await response.json()
    if (!result || typeof result !== "object" || !("checkoutId" in result) || typeof result.checkoutId !== "string" || !result.checkoutId) {
        throw new Error("Crater returned no guest checkout ID.")
    }

    return result.checkoutId
}

async function readCraterSessionError(response: Response, fallback: string) {
    const body: unknown = await response.json().catch(() => null)
    if (!body || typeof body !== "object") return fallback

    const payload = body as Record<string, unknown>
    const message = typeof payload.error === "string" ? payload.error : fallback
    const errorCode = typeof payload.errorCode === "string" ? payload.errorCode : null
    const details = Array.isArray(payload.details) ? payload.details.filter((detail): detail is string => typeof detail === "string") : []
    const diagnostics = [errorCode, details.join(", ")].filter(Boolean)

    return diagnostics.length ? `${message} (${diagnostics.join(": ")})` : message
}

export async function restoreCraterSession() {
    const response = await checkoutFetch("/api/crater/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
    })
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new Error(await readCraterSessionError(response, "Failed to validate the Crater session."))

    const body: unknown = await response.json()
    const guestEmail = body && typeof body === "object" && "guestEmail" in body && typeof body.guestEmail === "string" ? body.guestEmail : null
    return { guestEmail }
}

export async function getCheckoutCompletionStatus(sessionId: string, signal: AbortSignal) {
    const statusUrl = new URL("/api/crater/checkout/status", window.location.origin)
    statusUrl.searchParams.set("sessionId", sessionId)
    const requestController = new AbortController()
    let timedOut = false
    const abortRequest = () => requestController.abort()
    if (signal.aborted) abortRequest()
    else signal.addEventListener("abort", abortRequest, { once: true })
    const requestTimeout = window.setTimeout(() => {
        timedOut = true
        abortRequest()
    }, CHECKOUT_STATUS_REQUEST_TIMEOUT_MS)

    try {
        const response = await checkoutFetch(statusUrl, { cache: "no-store", credentials: "same-origin", signal: requestController.signal })
        try {
            return { body: await response.json(), ok: response.ok }
        } catch (error) {
            if (timedOut) throw error
            return { body: null, ok: response.ok }
        }
    } catch (error) {
        if (timedOut) throw new Error("The checkout status request timed out.")
        throw error
    } finally {
        window.clearTimeout(requestTimeout)
        signal.removeEventListener("abort", abortRequest)
    }
}

export function getCheckoutStatusPollDelay(attempt: number) {
    return Math.min(INITIAL_POLL_DELAY_MS * 2 ** Math.max(0, Math.floor(attempt)), MAX_POLL_DELAY_MS)
}

export function hasCheckoutStatusPollingExpired(startedAt: number, now: number) {
    return now - startedAt >= MAX_POLLING_DURATION_MS
}

type CheckoutErrorBody = { details?: unknown; error?: unknown; errorCode?: unknown }
export type CheckoutSubmissionErrorKind = "consent" | "customer" | "offer" | "session"

export class CheckoutSubmissionError extends Error {
    constructor(
        readonly kind: CheckoutSubmissionErrorKind,
        readonly errorCode: string | null,
        message: string,
        readonly status: number | null = null,
        readonly retryAfterSeconds: number | null = null,
        readonly details: string[] = []
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

export interface CheckoutStripeTaxLine {
    amount: number
    displayName: string
    inclusive: boolean
    percentage: number | null
}

export interface CheckoutStripePricingData {
    billingCountry: string | null
    currency: string
    discountAmount: number
    subtotalPrice: number
    taxAmount: number
    taxAmountInclusive: number
    taxLines: CheckoutStripeTaxLine[]
    totalPrice: number
}

async function readCheckoutError(response: Response, fallback: string) {
    try {
        const body = (await response.json()) as CheckoutErrorBody
        const error = typeof body.error === "string" ? body.error : fallback
        const errorCode = typeof body.errorCode === "string" ? body.errorCode : null
        const details = Array.isArray(body.details) ? body.details.filter((detail): detail is string => typeof detail === "string") : []
        return { errorCode, message: error, details }
    } catch {
        return { errorCode: null, message: fallback, details: [] }
    }
}

async function createCheckoutSubmissionError(response: Response, fallback: string, kind: CheckoutSubmissionErrorKind) {
    const error = await readCheckoutError(response, fallback)
    const retryAfterHeader = response.headers.get("Retry-After")
    const retryAfterSeconds = retryAfterHeader && /^\d+$/.test(retryAfterHeader) ? Number.parseInt(retryAfterHeader, 10) : null
    return new CheckoutSubmissionError(kind, error.errorCode, error.message, response.status, retryAfterSeconds, error.details)
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

function readCheckoutCustomers(body: unknown): CheckoutCustomerData[] {
    const source = body && typeof body === "object" ? (body as Record<string, unknown>) : null
    const values = source && Array.isArray(source.customers) ? source.customers : null
    if (!values) throw new CheckoutSubmissionError("customer", null, "Crater returned no customer list.")
    return values.map(parseCheckoutCustomer).filter((customer): customer is CheckoutCustomerData => customer !== null)
}

/**
 * Validates the Crater session and loads the user's customer in one request. `null` when there is no usable session.
 * `customers` is `null` when the response carries no customer list, so the caller loads it separately.
 */
export async function bootstrapCheckout() {
    const response = await checkoutFetch("/api/crater/checkout/bootstrap", {
        credentials: "same-origin",
        cache: "no-store",
    })
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new Error(await readCraterSessionError(response, "Failed to validate the Crater session."))

    const body: unknown = await response.json()
    const guestEmail = body && typeof body === "object" && "guestEmail" in body && typeof body.guestEmail === "string" ? body.guestEmail : null
    let customers: CheckoutCustomerData[] | null = null
    try {
        customers = readCheckoutCustomers(body)
    } catch {
        customers = null
    }
    return { customers, guestEmail }
}

export async function getCheckoutCustomers(preloaded: CheckoutCustomerData[] | null = null) {
    if (preloaded) return preloaded

    const response = await checkoutFetch("/api/crater/customer", { credentials: "same-origin" })
    if (!response.ok) throw await createCheckoutSubmissionError(response, "Failed to load billing customers.", "customer")
    return readCheckoutCustomers(await response.json())
}

export async function createCheckoutCustomer({ customerType, email, billingAddress }: { customerType: CraterCustomerType; email: string; billingAddress: StripeCheckoutContact }) {
    const { postal_code, ...address } = billingAddress.address
    const customerResponse = await checkoutFetch("/api/crater/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerType, email, name: billingAddress.name, address: { ...address, postalCode: postal_code } }),
        credentials: "same-origin",
    })
    if (!customerResponse.ok) throw await createCheckoutSubmissionError(customerResponse, "Failed to create the billing customer.", "customer")
    const customer = parseCheckoutCustomer(await customerResponse.json())
    if (!customer) throw new CheckoutSubmissionError("customer", null, "Crater returned an invalid customer.")
    return customer
}

export async function createCheckoutSession({ locale, searchParams }: { locale: AppLocale; searchParams: URLSearchParams }) {
    const checkoutResponse = await checkoutFetch("/api/crater/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(searchParams.entries()), locale }),
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

interface CheckoutConsents {
    terms: boolean
    withdrawal?: boolean
}

/**
 * Stores the ticked consents in Crater for exactly this Stripe Checkout Session. Resolves only once Crater recorded
 * them; the payment must not be confirmed otherwise, since Crater cancels and refunds a checkout without a consent.
 */
export async function recordCheckoutConsent({ sessionId, consents, termsVersion }: { sessionId: string; consents: CheckoutConsents; termsVersion?: string }) {
    const response = await checkoutFetch("/api/crater/checkout/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, consents, ...(termsVersion ? { termsVersion } : {}) }),
        credentials: "same-origin",
    })
    if (!response.ok) throw await createCheckoutSubmissionError(response, "The checkout consents could not be recorded.", "consent")
}

export async function sendCheckoutOffer({ email, searchParams }: { email: string; searchParams: URLSearchParams }) {
    const response = await checkoutFetch("/api/crater/checkout/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(searchParams.entries()), email }),
        credentials: "same-origin",
    })
    if (!response.ok) throw await createCheckoutSubmissionError(response, "Failed to send the offer.", "offer")
}
