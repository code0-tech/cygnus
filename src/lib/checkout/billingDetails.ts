import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export interface BillingDetails {
    city: string
    country: string
    email: string
    line1: string
    line2: string
    name: string
    phone: string
    postalCode: string
    state: string
    taxIdType: string
    taxIdValue: string
}

export const createEmptyBillingDetails = (): BillingDetails => ({
    city: "",
    country: "",
    email: "",
    line1: "",
    line2: "",
    name: "",
    phone: "",
    postalCode: "",
    state: "",
    taxIdType: "",
    taxIdValue: "",
})

export function createBillingDetailsValidation(customerType: CraterCustomerType, requireAddress = true) {
    return {
        name: (value: string) => (value.trim() ? null : "Name is required"),
        email: (value: string) => (!value.trim() ? "Email is required" : isValidEmail(value.trim()) ? null : "Please provide a valid email"),
        phone: () => null,
        line1: (value: string) => (!requireAddress || value.trim() ? null : "Address is required"),
        line2: () => null,
        postalCode: (value: string) => (!requireAddress || value.trim() ? null : "Postal code is required"),
        city: (value: string) => (!requireAddress || value.trim() ? null : "City is required"),
        state: () => null,
        country: (value: string) => (!requireAddress || value.trim().length === 2 ? null : "Please provide a two-letter country code"),
        taxIdType: (value: string) => (customerType === "business" && !value.trim() ? "Tax ID type is required" : null),
        taxIdValue: (value: string) => (customerType === "business" && !value.trim() ? "Tax ID is required" : null),
    }
}

export function getBillingStepStatus(values: BillingDetails, customerType: CraterCustomerType, requireAddress = true) {
    const contact = Boolean(values.name.trim()) && isValidEmail(values.email.trim())
    const address = Boolean(values.line1.trim() && values.postalCode.trim() && values.city.trim()) && values.country.trim().length === 2
    const hasTax = customerType === "business"
    const tax = !hasTax || Boolean(values.taxIdType.trim() && values.taxIdValue.trim())
    return { contact, address, hasTax, tax, complete: contact && (!requireAddress || address) && tax }
}
