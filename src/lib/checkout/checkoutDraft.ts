import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"
import type { StripeCheckoutContact } from "@stripe/stripe-js"

const CHECKOUT_DRAFT_KEY_PREFIX = "code0.checkout.customerDraftKey"
const CHECKOUT_CONTACT_DRAFT_KEY = "code0.checkout.contactDraft"
const CHECKOUT_CONTACT_DRAFT_TTL_MS = 10 * 60 * 1000
const inMemoryKeys = new Map<CraterCustomerType, string>()

type CheckoutContactDraftStage = "billingAddress" | "payment"

interface CheckoutContactDraft {
    billingAddress: StripeCheckoutContact | null
    configuration: string
    customerId: string
    email: string | null
    expiresAt: number
    stage: CheckoutContactDraftStage
}

function storageKey(customerType: CraterCustomerType) {
    return `${CHECKOUT_DRAFT_KEY_PREFIX}.${customerType}`
}

function createCheckoutKey() {
    return globalThis.crypto.randomUUID()
}

export function getOrCreateCheckoutDraftKey(customerType: CraterCustomerType) {
    const inMemoryKey = inMemoryKeys.get(customerType)
    if (inMemoryKey) return inMemoryKey

    try {
        const storedKey = window.sessionStorage.getItem(storageKey(customerType))?.trim()
        if (storedKey) {
            inMemoryKeys.set(customerType, storedKey)
            return storedKey
        }
    } catch {
        // Continue with an in-memory key when session storage is unavailable.
    }

    const checkoutKey = createCheckoutKey()
    inMemoryKeys.set(customerType, checkoutKey)

    try {
        window.sessionStorage.setItem(storageKey(customerType), checkoutKey)
    } catch {
        // The in-memory key still keeps requests idempotent for this page load.
    }

    return checkoutKey
}

function getCheckoutContactDraftConfiguration(searchParams: URLSearchParams) {
    const configuration = new URLSearchParams(searchParams)
    configuration.delete("paymentFailed")
    configuration.delete("promotionCode")
    configuration.delete("session_id")
    configuration.sort()
    return configuration.toString()
}

function optionalString(value: unknown): value is string | null {
    return value === null || typeof value === "string"
}

function parseBillingAddress(value: unknown): StripeCheckoutContact | null {
    if (!value || typeof value !== "object") return null
    const contact = value as Record<string, unknown>
    if (typeof contact.name !== "string" || !contact.address || typeof contact.address !== "object") return null

    const address = contact.address as Record<string, unknown>
    const optionalFields = [address.city, address.line1, address.line2, address.postal_code, address.state]
    if (typeof address.country !== "string" || !optionalFields.every(optionalString)) return null

    return {
        name: contact.name,
        address: {
            city: address.city as string | null,
            country: address.country,
            line1: address.line1 as string | null,
            line2: address.line2 as string | null,
            postal_code: address.postal_code as string | null,
            state: address.state as string | null,
        },
    }
}

export function saveCheckoutContactDraft({
    billingAddress,
    customerId,
    email,
    searchParams,
    stage,
}: {
    billingAddress: StripeCheckoutContact | null
    customerId: string
    email: string | null
    searchParams: URLSearchParams
    stage: CheckoutContactDraftStage
}) {
    const draft: CheckoutContactDraft = {
        billingAddress,
        configuration: getCheckoutContactDraftConfiguration(searchParams),
        customerId,
        email,
        expiresAt: Date.now() + CHECKOUT_CONTACT_DRAFT_TTL_MS,
        stage,
    }

    try {
        window.sessionStorage.setItem(CHECKOUT_CONTACT_DRAFT_KEY, JSON.stringify(draft))
    } catch {
        // The discount reload still works when storage is unavailable; only form values cannot be restored.
    }
}

export function getCheckoutContactDraftCustomerId(searchParams: URLSearchParams) {
    try {
        const stored = window.sessionStorage.getItem(CHECKOUT_CONTACT_DRAFT_KEY)
        if (!stored) return null

        const value: unknown = JSON.parse(stored)
        if (!value || typeof value !== "object") return null
        const draft = value as Record<string, unknown>
        if (
            typeof draft.customerId !== "string" ||
            draft.configuration !== getCheckoutContactDraftConfiguration(searchParams) ||
            typeof draft.expiresAt !== "number" ||
            draft.expiresAt <= Date.now()
        ) {
            return null
        }

        return draft.customerId
    } catch {
        return null
    }
}

export function takeCheckoutContactDraft({ customerId, searchParams }: { customerId: string; searchParams: URLSearchParams }) {
    try {
        const stored = window.sessionStorage.getItem(CHECKOUT_CONTACT_DRAFT_KEY)
        if (!stored) return null
        window.sessionStorage.removeItem(CHECKOUT_CONTACT_DRAFT_KEY)

        const value: unknown = JSON.parse(stored)
        if (!value || typeof value !== "object") return null
        const draft = value as Record<string, unknown>
        if (
            draft.customerId !== customerId ||
            draft.configuration !== getCheckoutContactDraftConfiguration(searchParams) ||
            typeof draft.expiresAt !== "number" ||
            draft.expiresAt <= Date.now() ||
            !optionalString(draft.email) ||
            (draft.stage !== "billingAddress" && draft.stage !== "payment")
        ) {
            return null
        }

        const billingAddress = draft.billingAddress === null ? null : parseBillingAddress(draft.billingAddress)
        if (draft.billingAddress !== null && !billingAddress) return null

        return { billingAddress, email: draft.email, stage: draft.stage as CheckoutContactDraftStage }
    } catch {
        try {
            window.sessionStorage.removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
        } catch {
            // Nothing else is required when session storage is unavailable.
        }
        return null
    }
}

export function clearCheckoutDraftKeys() {
    inMemoryKeys.clear()

    try {
        window.sessionStorage.removeItem(storageKey("business"))
        window.sessionStorage.removeItem(storageKey("personal"))
        window.sessionStorage.removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
    } catch {
        // Nothing else is required when session storage is unavailable.
    }
}
