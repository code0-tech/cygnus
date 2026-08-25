import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"

export function createLicenseNamespaceReturnPath(locale: AppLocale, customerId: string, licenseId: string) {
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    return `/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}/edit`
}

export function createLicenseNamespaceCallbackUrl(siteUrl: URL, returnPath: string) {
    const callbackUrl = new URL("/api/crater/licenses/namespace/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", returnPath)
    return callbackUrl.toString()
}
