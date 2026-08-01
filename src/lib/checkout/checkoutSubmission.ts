import type { BillingDetails } from "@/lib/checkout/billingDetails"
import { normalizeCountryCode, type CraterCustomerType } from "@/lib/checkout/craterCustomer"

type CheckoutErrorBody = { details?: unknown; error?: unknown; errorCode?: unknown }

async function readCheckoutError(response: Response, fallback: string) {
    try {
        const body = (await response.json()) as CheckoutErrorBody
        const error = typeof body.error === "string" ? body.error : fallback
        const errorCode = typeof body.errorCode === "string" ? body.errorCode : null
        const details = Array.isArray(body.details) ? body.details.filter((detail): detail is string => typeof detail === "string") : []
        return [error, ...(errorCode ? [`(${errorCode})`] : []), ...details].join(" ")
    } catch {
        return fallback
    }
}

export async function createCheckoutRedirect({
    values,
    customerType,
    searchParams,
    sessionToken,
}: {
    values: BillingDetails
    customerType: CraterCustomerType
    searchParams: URLSearchParams
    sessionToken: string
}) {
    const authorization = `Session ${sessionToken}`
    const customerResponse = await fetch("/api/crater/customer", {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({
            customerType,
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            address: {
                line1: values.line1.trim(),
                line2: values.line2.trim(),
                city: values.city.trim(),
                state: values.state.trim(),
                postalCode: values.postalCode.trim(),
                country: normalizeCountryCode(values.country),
            },
            ...(customerType === "business" ? { taxIdType: values.taxIdType.trim(), taxIdValue: values.taxIdValue.trim() } : {}),
        }),
    })
    if (!customerResponse.ok) throw new Error(await readCheckoutError(customerResponse, "Failed to create the billing customer."))

    const checkoutResponse = await fetch("/api/crater/checkout/session", {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(searchParams.entries())),
    })
    if (!checkoutResponse.ok) throw new Error(await readCheckoutError(checkoutResponse, "Failed to create a Crater checkout session."))
    const checkout: unknown = await checkoutResponse.json()
    if (!checkout || typeof checkout !== "object" || !("url" in checkout) || typeof checkout.url !== "string") throw new Error("Crater returned no checkout redirect URL.")
    return checkout.url
}
