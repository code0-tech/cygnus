export type CheckoutSearchParams = Record<string, string | string[] | undefined>

export function createCheckoutQuery(searchParams: CheckoutSearchParams): string {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item))
        } else if (value !== undefined) {
            query.set(key, value)
        }
    }

    return query.toString()
}

export function createMainAppLoginUrl(loginUrl: string, checkoutUrl: string): string {
    const url = new URL(loginUrl)
    url.searchParams.set("redirectUrl", checkoutUrl)
    return url.toString()
}
