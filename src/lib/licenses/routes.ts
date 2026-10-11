import { isCustomerId, isSubscriptionId } from "@/lib/crater/request"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"

type CraterRouteResource = "Customer" | "Subscription"

function decodeRouteValue(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

function resolveCraterRouteId(value: string, resource: CraterRouteResource) {
    const decodedValue = decodeRouteValue(value)
    return /^\d+$/.test(decodedValue) ? `gid://crater/${resource}/${decodedValue}` : decodedValue
}

function getCraterRouteSegment(value: string, resource: CraterRouteResource) {
    const decodedValue = decodeRouteValue(value)
    const match = new RegExp(`^gid://crater/${resource}/(\\d+)$`).exec(decodedValue)
    return encodeURIComponent(match?.[1] ?? decodedValue)
}

export function resolveCustomerRouteId(value: string) {
    return resolveCraterRouteId(value, "Customer")
}

export function resolveSubscriptionRouteId(value: string) {
    return resolveCraterRouteId(value, "Subscription")
}

export function createLicenseCustomerPath(locale: AppLocale, customerId: string) {
    return `/${locale}/licenses/customer/${getCraterRouteSegment(customerId, "Customer")}`
}

export function createLicensePath(locale: AppLocale, customerId: string, licenseId: string) {
    return `${createLicenseCustomerPath(locale, customerId)}/license/${getCraterRouteSegment(licenseId, "Subscription")}`
}

export function canonicalizeLicensePathname(pathname: string) {
    const segments = pathname.split("/")
    const customerMarker = segments.indexOf("customer")
    if (customerMarker < 2 || segments[customerMarker - 1] !== "licenses" || !segments[customerMarker + 1]) return pathname

    let changed = false
    const customerId = /^gid:\/\/crater\/Customer\/(\d+)$/.exec(decodeRouteValue(segments[customerMarker + 1]))?.[1]
    if (customerId) {
        segments[customerMarker + 1] = customerId
        changed = true
    }

    const licenseMarker = segments.indexOf("license", customerMarker + 2)
    if (licenseMarker >= 0 && segments[licenseMarker + 1]) {
        const licenseId = /^gid:\/\/crater\/Subscription\/(\d+)$/.exec(decodeRouteValue(segments[licenseMarker + 1]))?.[1]
        if (licenseId) {
            segments[licenseMarker + 1] = licenseId
            changed = true
        }
    }

    return changed ? segments.join("/") : pathname
}

export function createLicenseNamespaceReturnPath(locale: AppLocale, customerId: string, licenseId: string, destination: "detail" | "edit" = "edit") {
    const licensePath = createLicensePath(locale, customerId, licenseId)
    return destination === "edit" ? `${licensePath}/edit` : licensePath
}

export function createLicenseNamespaceCallbackUrl(siteUrl: URL, returnPath: string, state?: string) {
    const callbackUrl = new URL("/api/crater/licenses/namespace/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", returnPath)
    if (state) callbackUrl.searchParams.set("state", state)
    return callbackUrl.toString()
}

// Namespace links point at the start route, which sets the login state cookie before leaving for Sculptor.
export function createLicenseNamespaceStartPath(returnPath: string) {
    return `/api/crater/auth/start?${new URLSearchParams({ flow: "namespace", returnPath })}`
}

export function resolveLicenseNamespaceReturn(returnPath: string | null, siteOrigin: string) {
    if (!returnPath?.startsWith("/")) return null

    const returnUrl = new URL(returnPath, siteOrigin)
    const segments = returnUrl.pathname.split("/").filter(Boolean)
    if (
        returnUrl.origin !== siteOrigin ||
        returnUrl.search ||
        returnUrl.hash ||
        (segments.length !== 6 && segments.length !== 7) ||
        !isSupportedLocale(segments[0]) ||
        segments[1] !== "licenses" ||
        segments[2] !== "customer" ||
        segments[4] !== "license" ||
        (segments.length === 7 && segments[6] !== "edit")
    ) {
        return null
    }

    const customerId = resolveCustomerRouteId(segments[3])
    const subscriptionId = resolveSubscriptionRouteId(segments[5])
    if (!customerId || !isCustomerId(customerId) || !subscriptionId || !isSubscriptionId(subscriptionId)) return null

    return { subscriptionId, returnUrl }
}
