export type CheckoutSearchParams = Record<string, string | string[] | undefined>

export const SAGITTARIUS_TOKEN_QUERY_PARAM = "token"

export function readSagittariusToken(searchParams: Pick<URLSearchParams, "get">): string | undefined {
    const token = searchParams.get(SAGITTARIUS_TOKEN_QUERY_PARAM)?.trim()
    return token || undefined
}

export function removeSagittariusToken(url: URL): URL {
    const sanitizedUrl = new URL(url)
    sanitizedUrl.searchParams.delete(SAGITTARIUS_TOKEN_QUERY_PARAM)
    return sanitizedUrl
}

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
    url.searchParams.set("callbackUrl", checkoutUrl)
    return url.toString()
}
