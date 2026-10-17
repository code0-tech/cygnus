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
