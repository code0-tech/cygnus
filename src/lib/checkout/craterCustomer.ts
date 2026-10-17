import type { CustomerType } from "@code0-tech/crater-graphql-types"

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
