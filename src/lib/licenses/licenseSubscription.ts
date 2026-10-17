import type { SubscriptionCustomerType } from "@/lib/subscription/configurator"

export function resolveSubscriptionCustomerType(customerType: string | null | undefined): SubscriptionCustomerType {
    return customerType?.trim().toLowerCase() === "business" ? "b2b" : "b2c"
}
