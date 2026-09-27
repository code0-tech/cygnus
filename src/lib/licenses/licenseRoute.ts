import type { AppLocale } from "@/lib/i18n"

type CraterRouteResource = "Customer" | "License"

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

export function resolveLicenseRouteId(value: string) {
    return resolveCraterRouteId(value, "License")
}

export function createLicenseCustomerPath(locale: AppLocale, customerId: string) {
    return `/${locale}/licenses/customer/${getCraterRouteSegment(customerId, "Customer")}`
}

export function createLicensePath(locale: AppLocale, customerId: string, licenseId: string) {
    return `${createLicenseCustomerPath(locale, customerId)}/license/${getCraterRouteSegment(licenseId, "License")}`
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
        const licenseId = /^gid:\/\/crater\/License\/(\d+)$/.exec(decodeRouteValue(segments[licenseMarker + 1]))?.[1]
        if (licenseId) {
            segments[licenseMarker + 1] = licenseId
            changed = true
        }
    }

    return changed ? segments.join("/") : pathname
}

export function getNamespaceDisplayId(value?: string) {
    if (!value) return undefined

    const normalizedValue = value.trim().replace(/\/+$/, "")
    return normalizedValue.split("/").at(-1) || normalizedValue
}

export function createLicenseNamespaceReturnPath(locale: AppLocale, customerId: string, licenseId: string, destination: "detail" | "edit" = "edit") {
    const licensePath = createLicensePath(locale, customerId, licenseId)
    return destination === "edit" ? `${licensePath}/edit` : licensePath
}

export function createLicenseNamespaceCallbackUrl(siteUrl: URL, returnPath: string) {
    const callbackUrl = new URL("/api/crater/licenses/namespace/callback", siteUrl)
    callbackUrl.searchParams.set("returnPath", returnPath)
    return callbackUrl.toString()
}
