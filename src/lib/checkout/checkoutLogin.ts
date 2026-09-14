export type CheckoutSearchParams = Record<string, string | string[] | undefined>

export function createCheckoutQuery(searchParams: CheckoutSearchParams): string {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
        if (key === "token" || key === "authError") continue
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item))
        } else if (value !== undefined) {
            query.set(key, value)
        }
    }

    return query.toString()
}

export function createCraterLoginCallbackUrl(siteUrl: URL, checkoutPath: string) {
    const callbackUrl = new URL("/api/crater/auth/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", checkoutPath)
    return callbackUrl.toString()
}

// The checkout login step asks exactly one question: log in, or continue as a guest. A browser that
// already completed the Sagittarius login has answered it, so the step is skipped for it. Cloud keeps the
// step: its login link carries selectNamespace, and that round trip is what brings back the Sagittarius
// namespace the checkout session is created with.
export function canSkipCheckoutLogin(hasCraterUserLogin: boolean, deploymentType: string | undefined) {
    return hasCraterUserLogin && deploymentType !== "cloud"
}

export function createMainAppLoginUrl(loginUrl: string, callbackUrl: string, cancelUrl: string, selectNamespace = false): string {
    const url = new URL(loginUrl)
    url.searchParams.set("callbackUrl", callbackUrl)
    url.searchParams.set("cancelUrl", cancelUrl)
    if (selectNamespace) url.searchParams.set("selectNamespace", "true")
    return url.toString()
}
