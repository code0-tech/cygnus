import type { BillingDetails } from "@/lib/checkout/billingDetails"
import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"
import type { AppLocale } from "@/lib/i18n"

type CheckoutErrorBody = { details?: unknown; error?: unknown; errorCode?: unknown }

export interface CheckoutSessionData {
    clientSecret: string
    expiresAt: number | null
    id: string | null
}

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

async function createCheckoutCustomer({
    values,
    customerType,
    sessionToken,
}: {
    values: BillingDetails
    customerType: CraterCustomerType
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
            ...(customerType === "business" ? { taxIdType: values.taxIdType.trim(), taxIdValue: values.taxIdValue.trim() } : {}),
        }),
    })
    if (!customerResponse.ok) throw new Error(await readCheckoutError(customerResponse, "Failed to create the billing customer."))
}

export async function createCheckoutSession({ locale, searchParams, sessionToken }: { locale: AppLocale; searchParams: URLSearchParams; sessionToken: string }) {
    const authorization = `Session ${sessionToken}`
    const checkoutResponse = await fetch("/api/crater/checkout/session", {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(searchParams.entries()), locale }),
    })
    if (!checkoutResponse.ok) throw new Error(await readCheckoutError(checkoutResponse, "Failed to create a Crater checkout session."))
    const checkout: unknown = await checkoutResponse.json()
    if (!checkout || typeof checkout !== "object" || !("clientSecret" in checkout) || typeof checkout.clientSecret !== "string" || !checkout.clientSecret) {
        throw new Error("Crater returned no checkout client secret.")
    }

    return {
        clientSecret: checkout.clientSecret,
        expiresAt: "expiresAt" in checkout && typeof checkout.expiresAt === "number" ? checkout.expiresAt : null,
        id: "id" in checkout && typeof checkout.id === "string" ? checkout.id : null,
    } satisfies CheckoutSessionData
}

export async function prepareCheckoutSession({
    values,
    customerType,
    locale,
    searchParams,
    sessionToken,
}: {
    values: BillingDetails
    customerType: CraterCustomerType
    locale: AppLocale
    searchParams: URLSearchParams
    sessionToken: string
}) {
    await createCheckoutCustomer({ values, customerType, sessionToken })
    return createCheckoutSession({ locale, searchParams, sessionToken })
}
