export function checkoutFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers)
    const id = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("guestCheckout")
    if (id !== null) headers.set("x-guest-checkout", id)
    return fetch(input, { ...init, headers })
}
