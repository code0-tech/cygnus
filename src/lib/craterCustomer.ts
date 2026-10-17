export type CraterCustomerType = "business" | "personal"

export function resolveCraterCustomerType(value: string | null | undefined): CraterCustomerType {
    return value === "b2b" ? "business" : "personal"
}

export function normalizeCountryCode(value: FormDataEntryValue | null) {
    return typeof value === "string" ? value.trim().toUpperCase() : ""
}
