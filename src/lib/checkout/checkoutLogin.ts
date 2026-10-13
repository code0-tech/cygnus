import { isSupportedLocale } from "@/lib/i18n"

export type CheckoutSearchParams = Record<string, string | string[] | undefined>

const CHECKOUT_CONFIGURATION_PARAMS = ["plan", "deploymentType", "deployment", "customerType", "paymentPeriod", "workflowExecutions", "aiTokens"]

export function hasCheckoutConfiguration(searchParams: URLSearchParams) {
    return CHECKOUT_CONFIGURATION_PARAMS.some((key) => Boolean(searchParams.get(key)))
}

export function createCheckoutQuery(searchParams: CheckoutSearchParams): string {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
        if (key === "token" || key === "authError" || key === "guestCheckout") continue
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item))
        } else if (value !== undefined) {
            query.set(key, value)
        }
    }

    return query.toString()
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

    returnUrl.searchParams.delete("guestCheckout")
    returnUrl.searchParams.delete("token")
    returnUrl.searchParams.delete("authError")
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
