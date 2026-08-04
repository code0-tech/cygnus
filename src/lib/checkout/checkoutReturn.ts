const CHECKOUT_SESSION_ID_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]{6,}$/

export function parseCheckoutSessionId(value: string | string[] | undefined): string | null {
    if (typeof value !== "string" || value.length > 255 || !CHECKOUT_SESSION_ID_PATTERN.test(value)) return null
    return value
}
