import type { StripeCheckoutContact } from "@stripe/stripe-js"

// Account drafts survive a closed tab for the TTL below. Guest drafts stay in sessionStorage,
// so the purchase selection is never persisted as a browser-wide preference.
const CHECKOUT_CONTACT_DRAFT_KEY = "code0.checkout.contactDraft"
const CHECKOUT_CONTACT_DRAFT_TTL_MS = 30 * 60 * 1000

type CheckoutContactDraftStage = "billingAddress" | "payment"

export interface CheckoutContactDraft {
    billingAddress: StripeCheckoutContact | null
    billingAddressComplete: boolean
    configuration: string
    customerId: string | null
    email: string | null
    emailComplete: boolean
    emailSyncedToStripe: boolean
    expiresAt: number
    stage: CheckoutContactDraftStage
}

interface SaveCheckoutContactDraftInput {
    billingAddress: StripeCheckoutContact | null
    billingAddressComplete?: boolean
    customerId: string | null
    email: string | null
    emailComplete?: boolean
    emailSyncedToStripe?: boolean
    searchParams: URLSearchParams
    stage: CheckoutContactDraftStage
}

function draftStorage(searchParams: URLSearchParams) {
    return searchParams.has("guestCheckout") ? window.sessionStorage : window.localStorage
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
    billingAddressComplete = Boolean(billingAddress),
    customerId,
    email,
    emailComplete = Boolean(email),
    emailSyncedToStripe = false,
    searchParams,
    stage,
}: SaveCheckoutContactDraftInput) {
    const draft: CheckoutContactDraft = {
        billingAddress,
        billingAddressComplete,
        configuration: getCheckoutContactDraftConfiguration(searchParams),
        customerId,
        email,
        emailComplete,
        emailSyncedToStripe,
        expiresAt: Date.now() + CHECKOUT_CONTACT_DRAFT_TTL_MS,
        stage,
    }

    try {
        draftStorage(searchParams).setItem(CHECKOUT_CONTACT_DRAFT_KEY, JSON.stringify(draft))
    } catch {
        // Checkout still works when storage is unavailable; only form recovery is disabled.
    }
}

export function readCheckoutContactDraft(searchParams: URLSearchParams): CheckoutContactDraft | null {
    try {
        const stored = draftStorage(searchParams).getItem(CHECKOUT_CONTACT_DRAFT_KEY)
        if (!stored) return null

        const value: unknown = JSON.parse(stored)
        if (!value || typeof value !== "object") {
            draftStorage(searchParams).removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
            return null
        }
        const draft = value as Record<string, unknown>
        if (
            !optionalString(draft.customerId) ||
            draft.configuration !== getCheckoutContactDraftConfiguration(searchParams) ||
            typeof draft.expiresAt !== "number" ||
            draft.expiresAt <= Date.now() ||
            !optionalString(draft.email) ||
            (draft.stage !== "billingAddress" && draft.stage !== "payment")
        ) {
            draftStorage(searchParams).removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
            return null
        }

        const billingAddress = draft.billingAddress === null ? null : parseBillingAddress(draft.billingAddress)
        if (draft.billingAddress !== null && !billingAddress) {
            draftStorage(searchParams).removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
            return null
        }

        return {
            billingAddress,
            billingAddressComplete: typeof draft.billingAddressComplete === "boolean" ? draft.billingAddressComplete : Boolean(billingAddress),
            configuration: draft.configuration as string,
            customerId: draft.customerId,
            email: draft.email,
            emailComplete: typeof draft.emailComplete === "boolean" ? draft.emailComplete : Boolean(draft.email),
            // Older drafts cannot tell whether Stripe already accepted a complete email.
            // Treating it as synchronized prevents a legacy draft from replaying the email
            // into a Customer-backed Checkout Session and breaking the entire form load.
            emailSyncedToStripe:
                typeof draft.emailSyncedToStripe === "boolean"
                    ? draft.emailSyncedToStripe
                    : Boolean(draft.email) && (typeof draft.emailComplete !== "boolean" || draft.emailComplete),
            expiresAt: draft.expiresAt,
            stage: draft.stage as CheckoutContactDraftStage,
        }
    } catch {
        try {
            draftStorage(searchParams).removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
        } catch {
            // Nothing else is required when local storage is unavailable.
        }
        return null
    }
}

export function getCheckoutContactDraftCustomerId(searchParams: URLSearchParams) {
    return readCheckoutContactDraft(searchParams)?.customerId ?? null
}

export function clearCheckoutContactDraft() {
    for (const storage of ["localStorage", "sessionStorage"] as const) {
        try {
            window[storage].removeItem(CHECKOUT_CONTACT_DRAFT_KEY)
        } catch {
            // Storage is optional.
        }
    }
}
