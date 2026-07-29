import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

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
            fetch,
            headers: sessionToken
                ? {
                      authorization: `Session ${sessionToken}`,
                  }
                : undefined,
        }),
    })
}
