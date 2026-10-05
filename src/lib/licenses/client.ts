import type { SubscriptionUpdateResult } from "@/lib/subscription/types"
import { resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import type { CustomerPaymentMethodSummary, LicenseDashboardData } from "@/lib/licenses/types"

type PaginatedLicenseResource = "customers" | "invoices" | "licenses"

interface LicenseDashboardRequest {
    cursor: string
    customerContext?: string
    resource: PaginatedLicenseResource
}

export interface LicenseCustomerUpdate {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: {
        line1?: string | null
        line2?: string | null
        city?: string | null
        state?: string | null
        postalCode?: string | null
        country?: string | null
    }
    paymentMethods?: string[]
}

function createLicenseDashboardUrl(pathname: string, origin: string, pagination?: LicenseDashboardRequest) {
    const dataUrl = new URL("/api/crater/licenses", origin)
    const pathSegments = pathname.split("/").filter(Boolean)
    const customerSegmentIndex = pathSegments.indexOf("customer")
    const licenseSegmentIndex = pathSegments.indexOf("license")

    if (customerSegmentIndex >= 0 && pathSegments[customerSegmentIndex + 1]) {
        dataUrl.searchParams.set("view", licenseSegmentIndex >= 0 ? "license" : "customer")
        dataUrl.searchParams.set("customerId", resolveCustomerRouteId(pathSegments[customerSegmentIndex + 1]))
        if (licenseSegmentIndex >= 0 && pathSegments[licenseSegmentIndex + 1]) {
            dataUrl.searchParams.set("licenseId", resolveSubscriptionRouteId(pathSegments[licenseSegmentIndex + 1]))
        }
    }

    if (pagination) {
        const cursorName = pagination.resource === "customers" ? "customerAfter" : pagination.resource === "licenses" ? "licenseAfter" : "invoiceAfter"
        dataUrl.searchParams.set(cursorName, pagination.cursor)
        dataUrl.searchParams.set("includeNavigation", "false")
        if (pagination.customerContext) dataUrl.searchParams.set("customerContext", pagination.customerContext)
    }

    return dataUrl
}

export async function fetchLicenseDashboard(pathname: string, options: { origin: string; pagination?: LicenseDashboardRequest; signal?: AbortSignal }) {
    const response = await fetch(createLicenseDashboardUrl(pathname, options.origin, options.pagination), {
        cache: "no-store",
        credentials: "same-origin",
        signal: options.signal,
    })

    return {
        status: response.status,
        data: response.ok ? ((await response.json()) as LicenseDashboardData) : null,
    }
}

export async function logoutLicenseSession() {
    const response = await fetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
    if (!response.ok) throw new Error("Could not log out.")
}

async function updateLicenseCustomerRequest(request: LicenseCustomerUpdate) {
    return fetch("/api/crater/customer", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
    })
}

export async function updateLicenseCustomer(request: LicenseCustomerUpdate, errorMessage: string) {
    const response = await updateLicenseCustomerRequest(request)
    if (!response.ok) throw new Error(errorMessage)
}

export async function removeLicenseCustomerPaymentMethod(customerId: string, paymentMethodIds: string[]) {
    const response = await updateLicenseCustomerRequest({ id: customerId, paymentMethods: paymentMethodIds })
    if (response.ok) return

    const result: unknown = await response.json().catch(() => null)
    const errorCode = result && typeof result === "object" && "errorCode" in result ? result.errorCode : null
    return typeof errorCode === "string" ? errorCode : "UNKNOWN"
}

async function updateLicenseSubscription(path: "/api/crater/subscriptions/cancel" | "/api/crater/subscriptions/resume", id: string, errorMessage: string) {
    const response = await fetch(path, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
    })
    if (!response.ok) throw new Error(errorMessage)

    const result: unknown = await response.json()
    return result && typeof result === "object" ? (result as SubscriptionUpdateResult) : {}
}

export function cancelLicenseSubscription(id: string, errorMessage: string) {
    return updateLicenseSubscription("/api/crater/subscriptions/cancel", id, errorMessage)
}

export function resumeLicenseSubscription(id: string, errorMessage: string) {
    return updateLicenseSubscription("/api/crater/subscriptions/resume", id, errorMessage)
}

export async function createPaymentMethodSetup(customerId: string, errorMessage: string) {
    const response = await fetch("/api/crater/customer/payment-method-setup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId }),
    })
    const result: unknown = await response.json()
    if (!response.ok || !result || typeof result !== "object" || !("clientSecret" in result) || typeof result.clientSecret !== "string") throw new Error(errorMessage)
    return result.clientSecret
}

export async function getPaymentMethodSetupStatus(customerId: string, setupIntentId: string, signal: AbortSignal) {
    const statusUrl = new URL("/api/crater/customer/payment-method-setup", window.location.origin)
    statusUrl.searchParams.set("customerId", customerId)
    statusUrl.searchParams.set("setupIntentId", setupIntentId)
    const response = await fetch(statusUrl, { cache: "no-store", credentials: "same-origin", signal })
    const result: unknown = await response.json()
    if (!response.ok || !result || typeof result !== "object" || !("status" in result) || (result.status !== "ready" && result.status !== "pending" && result.status !== "failed")) {
        throw new Error("Invalid payment method setup status response.")
    }
    return result.status
}

export async function fetchCustomerPaymentMethods(customerId: string, signal: AbortSignal): Promise<CustomerPaymentMethodSummary[]> {
    const url = new URL("/api/crater/customer/payment-methods", window.location.origin)
    url.searchParams.set("customerId", customerId)

    const response = await fetch(url, { cache: "no-store", credentials: "same-origin", signal })
    const result: unknown = await response.json()
    if (!response.ok || !result || typeof result !== "object" || !("paymentMethods" in result) || !Array.isArray(result.paymentMethods)) {
        throw new Error("Invalid payment methods response.")
    }

    return result.paymentMethods as CustomerPaymentMethodSummary[]
}

export async function downloadLicenseFile(licenseId: string, request: typeof fetch = fetch) {
    const response = await request("/api/crater/licenses/export", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: licenseId }),
    })
    if (!response.ok) throw new Error("License export failed.")

    const file = await response.blob()
    const fileName = response.headers.get("x-license-filename")?.trim() || "code0-license.czlc"
    const fileUrl = URL.createObjectURL(file)
    const download = document.createElement("a")
    download.href = fileUrl
    download.download = fileName
    document.body.append(download)
    download.click()
    download.remove()
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1_000)
}
