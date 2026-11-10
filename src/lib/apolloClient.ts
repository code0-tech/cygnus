import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

const DEFAULT_CRATER_REQUEST_TIMEOUT_MS = 10_000

function craterRequestTimeoutMs() {
    const value = process.env.CRATER_REQUEST_TIMEOUT_MS
    const parsed = value && /^\d+$/.test(value) ? Number.parseInt(value, 10) : NaN
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CRATER_REQUEST_TIMEOUT_MS
}

// A Crater that stops answering must fail the request instead of holding every route until the platform timeout.
const fetchWithTimeout: typeof fetch = (input, init) => {
    const timeout = AbortSignal.timeout(craterRequestTimeoutMs())
    return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout })
}

export function createApolloClient(sessionToken?: string) {
    const uri = process.env.CRATER_GRAPHQL_URL

    if (!uri) {
        throw new Error("CRATER_GRAPHQL_URL is not configured.")
    }

    return new ApolloClient({
        cache: new InMemoryCache(),
        defaultOptions: {
            mutate: {
                fetchPolicy: "no-cache",
            },
            query: {
                fetchPolicy: "no-cache",
            },
            watchQuery: {
                fetchPolicy: "no-cache",
            },
        },
        link: new HttpLink({
            uri,
            fetch: fetchWithTimeout,
            headers: sessionToken
                ? {
                      authorization: `Session ${sessionToken}`,
                  }
                : undefined,
        }),
    })
}
