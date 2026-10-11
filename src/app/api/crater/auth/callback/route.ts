import { noStoreRedirect as craterNoStoreRedirect } from "@/lib/crater/api.server"
import { resolveCheckoutReturnUrl } from "@/lib/checkout/checkoutLogin"
import { describeCraterError } from "@/lib/crater/errors"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { clearCraterLoginStateCookie, verifyCraterLoginState } from "@/lib/crater/loginState.server"
import { setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import { resolveSiteUrl } from "@/lib/siteConfig"

export const runtime = "nodejs"

const noStoreRedirect = (url: URL) => craterNoStoreRedirect(url, { noReferrer: true })

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const siteOrigin = resolveSiteUrl().origin
    const redirect = (url: URL) => clearCraterLoginStateCookie(noStoreRedirect(url), request)
    const returnUrl = resolveCheckoutReturnUrl(requestUrl.searchParams.get("returnPath"), siteOrigin)
    if (!returnUrl) {
        const fallbackUrl = new URL("/", siteOrigin)
        fallbackUrl.searchParams.set("authError", "session")
        return redirect(fallbackUrl)
    }

    const sagittariusToken = requestUrl.searchParams.get("token")?.trim()
    const namespaceId = requestUrl.searchParams.get("namespace")?.trim()

    if (namespaceId) returnUrl.searchParams.set("namespace", namespaceId)

    // Only a login this browser started may create its session; anything else is a forged callback link.
    if (!sagittariusToken || !verifyCraterLoginState(request, requestUrl)) {
        returnUrl.searchParams.set("authError", "session")
        return redirect(returnUrl)
    }

    try {
        const payload = await createCraterUserSession(sagittariusToken)
        if (payload.errors?.length || !payload.userSession?.token) {
            const failure = describeCraterError(payload.errors)
            console.error("Crater rejected the server-side login callback:", failure ? [failure.errorCode, ...failure.details].join(": ") : "Crater returned no user session token.")
            returnUrl.searchParams.set("authError", "session")
            return redirect(returnUrl)
        }

        return setCraterUserLoginCookie(setCraterSessionCookie(redirect(returnUrl), payload.userSession.token))
    } catch (error) {
        console.error("Crater server-side login callback error:", error instanceof Error ? error.name : "Unknown error")
        returnUrl.searchParams.set("authError", "session")
        return redirect(returnUrl)
    }
}
