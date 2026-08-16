import type { SubscriptionCustomerType } from "@/lib/subscriptionConfigurator"

// Crater's Customer.customerType is "business" | "personal"; the subscription configurator and its price/period
// rules are keyed by "b2b" | "b2c" instead. resolveCraterCustomerType in checkout/craterCustomer.ts only goes the
// other way (b2b/b2c -> business/personal), so this is the missing inverse for the license dashboard.
export function resolveSubscriptionCustomerType(customerType: string | null | undefined): SubscriptionCustomerType {
    return customerType?.trim().toLowerCase() === "business" ? "b2b" : "b2c"
}
