import { isSupportedLocale } from "@/lib/i18n"

export type CheckoutSearchParams = Record<string, string | string[] | undefined>

const CHECKOUT_CONFIGURATION_PARAMS = ["plan", "deploymentType", "deployment", "customerType", "paymentPeriod", "workflowExecutions", "aiTokens"]

// Why the checkout sent the visitor back to the login choice. Only the login page reads it; it never travels on.
export const CHECKOUT_LOGIN_NOTICE_PARAM = "loginNotice"
export type CheckoutLoginNotice = "customerTypeMismatch"
const CHECKOUT_LOGIN_NOTICES: readonly CheckoutLoginNotice[] = ["customerTypeMismatch"]
// Session and one-shot state that must not be carried from the checkout to the login choice or back.
const CHECKOUT_TRANSIENT_PARAMS = ["token", "authError", "guestCheckout", CHECKOUT_LOGIN_NOTICE_PARAM]

export function resolveCheckoutLoginNotice(value: string | string[] | undefined): CheckoutLoginNotice | null {
    const notice = Array.isArray(value) ? value[0] : value
    return CHECKOUT_LOGIN_NOTICES.find((candidate) => candidate === notice) ?? null
}

/** The login choice for the current checkout configuration, explaining why the checkout could not continue. */
export function createCheckoutLoginNoticePath(locale: string, searchParams: URLSearchParams, notice: CheckoutLoginNotice) {
    const query = new URLSearchParams(searchParams)
    CHECKOUT_TRANSIENT_PARAMS.forEach((key) => query.delete(key))
    query.set(CHECKOUT_LOGIN_NOTICE_PARAM, notice)
    return `/${locale}/checkout/login?${query}`
}

export function hasCheckoutConfiguration(searchParams: URLSearchParams) {
    return CHECKOUT_CONFIGURATION_PARAMS.some((key) => Boolean(searchParams.get(key)))
}

export function createCheckoutQuery(searchParams: CheckoutSearchParams): string {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
        if (CHECKOUT_TRANSIENT_PARAMS.includes(key)) continue
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item))
        } else if (value !== undefined) {
            query.set(key, value)
        }
    }

    return query.toString()
}

/**
 * Where to send a checkout request that cannot have a Crater session, decided on the server before anything renders.
 * Without the account login marker and outside a guest checkout no session can exist, so the visitor goes straight to
 * the login choice instead of seeing the checkout flash before the browser redirects. A failed login callback
 * (`authError`) stays on the checkout, which shows its error message. `null` means the checkout should render.
 */
export function resolveCheckoutLoginRedirect(locale: string, searchParams: CheckoutSearchParams, hasAccountLogin: boolean) {
    if (hasAccountLogin || searchParams.guestCheckout !== undefined || searchParams.authError !== undefined) return null
    const query = createCheckoutQuery(searchParams)
    return `/${locale}/checkout/login${query ? `?${query}` : ""}`
}

export function createCraterLoginCallbackUrl(siteUrl: URL, checkoutPath: string, state?: string) {
    const callbackUrl = new URL("/api/crater/auth/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", checkoutPath)
    if (state) callbackUrl.searchParams.set("state", state)
    return callbackUrl.toString()
}

// Login links point at the start route, which sets the login state cookie before leaving for Sculptor.
export function createCheckoutLoginStartPath(checkoutPath: string, cancelUrl: string) {
    return `/api/crater/auth/start?${new URLSearchParams({ flow: "checkout", returnPath: checkoutPath, cancelUrl })}`
}

export function resolveCheckoutSessionHref(searchParams: URLSearchParams, checkoutHref: string, loginHref: string): string {
    const deploymentType = searchParams.get("deploymentType") ?? searchParams.get("deployment")
    return deploymentType === "cloud" && !searchParams.get("namespace")?.trim() ? loginHref : checkoutHref
}

export function resolveCheckoutReturnUrl(returnPath: string | null, siteOrigin: string) {
    if (!returnPath?.startsWith("/")) return null

    const returnUrl = new URL(returnPath, siteOrigin)
    const segments = returnUrl.pathname.split("/").filter(Boolean)
    if (returnUrl.origin !== siteOrigin || segments.length !== 2 || !isSupportedLocale(segments[0]) || segments[1] !== "checkout") return null

    CHECKOUT_TRANSIENT_PARAMS.forEach((key) => returnUrl.searchParams.delete(key))
    return returnUrl
}

export function createMainAppLoginUrl(loginUrl: string, callbackUrl: string, cancelUrl: string, selectNamespace = false): string {
    const url = new URL(loginUrl)
    url.hash = ""
    url.searchParams.set("callbackUrl", callbackUrl)
    url.searchParams.set("cancelUrl", cancelUrl)
    if (selectNamespace) url.searchParams.set("selectNamespace", "true")
    return url.toString()
}
