const INITIAL_POLL_DELAY_MS = 2_000
const MAX_POLL_DELAY_MS = 10_000
const MAX_POLLING_DURATION_MS = 5 * 60_000

export function checkoutFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers)
    const id = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("guestCheckout")
    if (id !== null) headers.set("x-guest-checkout", id)
    return fetch(input, { ...init, headers })
}

export function replaceCheckoutPage(url: string) {
    window.location.replace(url)
}

export function getCheckoutStatusPollDelay(attempt: number) {
    return Math.min(INITIAL_POLL_DELAY_MS * 2 ** Math.max(0, Math.floor(attempt)), MAX_POLL_DELAY_MS)
}

export function hasCheckoutStatusPollingExpired(startedAt: number, now: number) {
    return now - startedAt >= MAX_POLLING_DURATION_MS
}
