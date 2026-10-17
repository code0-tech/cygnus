import { createCraterLoginCallbackUrl, createMainAppLoginUrl, resolveCheckoutReturnUrl } from "@/lib/checkout/checkoutLogin"
import { getClientConfig } from "@/lib/clientConfig.server"
import { noStoreRedirect } from "@/lib/crater/api.server"
import { createCraterLoginState, setCraterLoginStateCookie } from "@/lib/crater/loginState.server"
import { createLicenseNamespaceCallbackUrl, resolveLicenseDashboardReturnUrl, resolveLicenseNamespaceReturn } from "@/lib/licenses/routes"
import { resolveSiteUrl } from "@/lib/siteConfig"

export const runtime = "nodejs"

function sameOriginUrl(value: string | null, siteUrl: URL) {
    if (!value) return null
    try {
        const url = new URL(value, siteUrl)
        return url.origin === siteUrl.origin ? url : null
    } catch {
        return null
    }
}

function resolveLoginTarget(requestUrl: URL, siteUrl: URL, state: string) {
    const returnPath = requestUrl.searchParams.get("returnPath")

    if (requestUrl.searchParams.get("flow") === "checkout") {
        const returnUrl = resolveCheckoutReturnUrl(returnPath, siteUrl.origin)
        if (!returnUrl) return null

        const locale = returnUrl.pathname.split("/").filter(Boolean)[0]
        const cancelUrl = sameOriginUrl(requestUrl.searchParams.get("cancelUrl"), siteUrl) ?? new URL(`/${locale}/subscription`, siteUrl)
        const checkoutPath = `${returnUrl.pathname}${returnUrl.search}`
        return {
            callbackUrl: createCraterLoginCallbackUrl(siteUrl, checkoutPath, state),
            cancelUrl: cancelUrl.toString(),
            selectNamespace: (returnUrl.searchParams.get("deploymentType") ?? returnUrl.searchParams.get("deployment")) === "cloud",
        }
    }

    if (requestUrl.searchParams.get("flow") === "namespace") {
        const resolvedReturn = resolveLicenseNamespaceReturn(returnPath, siteUrl.origin)
        if (!resolvedReturn) return null

        return {
            callbackUrl: createLicenseNamespaceCallbackUrl(siteUrl, resolvedReturn.returnUrl.pathname, state),
            cancelUrl: resolvedReturn.returnUrl.toString(),
            selectNamespace: true,
        }
    }

    if (requestUrl.searchParams.get("flow") === "licenses") {
        const resolvedReturn = resolveLicenseDashboardReturnUrl(returnPath, siteUrl.origin)
        if (!resolvedReturn) return null

        return {
            callbackUrl: createCraterLoginCallbackUrl(siteUrl, `${resolvedReturn.returnUrl.pathname}${resolvedReturn.returnUrl.search}`, state),
            cancelUrl: new URL(`/${resolvedReturn.locale}`, siteUrl).toString(),
            selectNamespace: false,
        }
    }

    return null
}

// Starts a Sagittarius login: the state cookie set here is what the callbacks compare against, so a
// callback link opened without going through this route cannot log the browser in.
export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const siteUrl = resolveSiteUrl()
    const state = createCraterLoginState()
    const target = resolveLoginTarget(requestUrl, siteUrl, state)
    if (!target) return noStoreRedirect(new URL("/", siteUrl))

    const loginUrl = createMainAppLoginUrl(getClientConfig().sculptorLoginUrl, target.callbackUrl, target.cancelUrl, target.selectNamespace)
    return setCraterLoginStateCookie(noStoreRedirect(new URL(loginUrl)), state)
}
