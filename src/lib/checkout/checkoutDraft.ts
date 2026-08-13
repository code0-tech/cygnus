import type { CraterCustomerType } from "@/lib/checkout/craterCustomer"

const CHECKOUT_DRAFT_KEY_PREFIX = "code0.checkout.customerDraftKey"
const inMemoryKeys = new Map<CraterCustomerType, string>()

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

export function clearCheckoutDraftKeys() {
    inMemoryKeys.clear()

    try {
        window.sessionStorage.removeItem(storageKey("business"))
        window.sessionStorage.removeItem(storageKey("personal"))
    } catch {
        // Nothing else is required when session storage is unavailable.
    }
}
