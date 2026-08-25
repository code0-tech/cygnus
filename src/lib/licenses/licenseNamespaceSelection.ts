import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"

export function createLicenseNamespaceReturnPath(locale: AppLocale, customerId: string, licenseId: string, destination: "detail" | "edit" = "edit") {
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const licensePath = `/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`
    return destination === "edit" ? `${licensePath}/edit` : licensePath
}

export function createLicenseNamespaceCallbackUrl(siteUrl: URL, returnPath: string) {
    const callbackUrl = new URL("/api/crater/licenses/namespace/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", returnPath)
    return callbackUrl.toString()
}
