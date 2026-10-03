export interface PaymentMethodDisplayDetails {
    brand: string | null
    expiresMonth: number | null
    expiresYear: number | null
    last4: string | null
    type: string | null
}

export interface CustomerPaymentMethodSummary extends PaymentMethodDisplayDetails {
    id: string
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
