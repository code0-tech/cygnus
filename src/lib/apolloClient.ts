import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

let apolloClient: ApolloClient | undefined

export function getApolloClient() {
    if (apolloClient) return apolloClient

    const uri = process.env.CRATER_GRAPHQL_URL

    if (!uri) {
        throw new Error("CRATER_GRAPHQL_URL is not configured.")
    }

    apolloClient = new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({
            uri,
            fetch,
        }),
    })

    return apolloClient
}
