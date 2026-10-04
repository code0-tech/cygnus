import type { PaymentPeriod } from "@/lib/subscription/calculator"
import type { SubscriptionCustomerType } from "@/lib/subscription/configurator"
import type { CheckoutPaymentPeriod, CheckoutPlan, CustomerType } from "@code0-tech/crater-graphql-types"

const CHECKOUT_SESSION_ID_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]{6,}$/

export function parseCheckoutSessionId(value: string | string[] | undefined): string | null {
    if (typeof value !== "string" || value.length > 255 || !CHECKOUT_SESSION_ID_PATTERN.test(value)) return null
    return value
}

const CRATER_PAYMENT_PERIODS = {
    monthly: "MONTHLY" as CheckoutPaymentPeriod,
    quarterly: "QUARTERLY" as CheckoutPaymentPeriod,
    yearly: "YEARLY" as CheckoutPaymentPeriod,
} as const satisfies Record<PaymentPeriod, CheckoutPaymentPeriod>

export function toCraterPaymentPeriod(paymentPeriod: PaymentPeriod): CheckoutPaymentPeriod {
    return CRATER_PAYMENT_PERIODS[paymentPeriod]
}

export function parseCraterPaymentPeriod(paymentPeriod: string | undefined): CheckoutPaymentPeriod | null {
    return paymentPeriod && Object.hasOwn(CRATER_PAYMENT_PERIODS, paymentPeriod) ? CRATER_PAYMENT_PERIODS[paymentPeriod as PaymentPeriod] : null
}

const CRATER_PLANS = {
    pro: "PRO",
    max: "MAX",
    custom: "CUSTOM",
} as const satisfies Record<string, `${CheckoutPlan}`>

// The package ships declaration-only const enums, so these values cannot be imported at runtime.
export function toCraterPlan(plan: keyof typeof CRATER_PLANS): CheckoutPlan {
    return CRATER_PLANS[plan] as CheckoutPlan
}

export function parseCraterPlan(plan: string): CheckoutPlan | null {
    return Object.hasOwn(CRATER_PLANS, plan) ? toCraterPlan(plan as keyof typeof CRATER_PLANS) : null
}

export type CraterDeploymentType = "cloud" | "self_hosted"
export type CraterPlan = keyof typeof CRATER_PLANS

function normalizeEnumValue(value: string | null | undefined) {
    return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function normalizeCraterDeploymentType(value: string | null | undefined): CraterDeploymentType | undefined {
    const normalized = normalizeEnumValue(value)
    return normalized === "cloud" || normalized === "self_hosted" ? normalized : undefined
}

export function normalizeCraterPlan(value: string | null | undefined): CraterPlan | undefined {
    const normalized = normalizeEnumValue(value)
    // Licenses created before Crater's CheckoutPlan enum still carry the custom_plan value.
    if (normalized === "custom_plan") return "custom"
    return Object.hasOwn(CRATER_PLANS, normalized) ? (normalized as CraterPlan) : undefined
}

export function normalizeCraterPaymentPeriod(value: string | null | undefined): PaymentPeriod | undefined {
    const normalized = normalizeEnumValue(value)
    return Object.hasOwn(CRATER_PAYMENT_PERIODS, normalized) ? (normalized as PaymentPeriod) : undefined
}

export type CraterCustomerType = "business" | "personal"

export function resolveCraterCustomerType(value: string | null | undefined): CraterCustomerType {
    return value === "b2b" ? "business" : "personal"
}

// Crater types customerType as a CustomerType enum with the values PERSONAL and BUSINESS. cygnus keeps the
// lowercase values its routes, CMS labels, and checkout URL parameters are built on, so the enum is only
// spoken at the GraphQL boundary and every Crater response is normalized back on the way out.
export function toCraterCustomerTypeEnum(value: CraterCustomerType): CustomerType {
    return (value === "business" ? "BUSINESS" : "PERSONAL") as CustomerType
}

export function normalizeCraterCustomerType(value: string | null | undefined): CraterCustomerType | undefined {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
    return normalized === "business" || normalized === "personal" ? normalized : undefined
}

export function normalizeCountryCode(value: FormDataEntryValue | null) {
    return typeof value === "string" ? value.trim().toUpperCase() : ""
}

export function resolveSubscriptionCustomerType(customerType: string | null | undefined): SubscriptionCustomerType {
    return customerType?.trim().toLowerCase() === "business" ? "b2b" : "b2c"
}
