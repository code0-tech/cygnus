import { createApolloClient } from "@/lib/apolloClient"
import { normalizeSubscriptionPrices } from "@/lib/subscriptionPrices"
import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import "server-only"

type SubscriptionPricesData = {
    subscriptionPrices?: CheckoutPrice[] | null
}

const SUBSCRIPTION_PRICES: TypedDocumentNode<SubscriptionPricesData> = gql`
    query SubscriptionPrices {
        subscriptionPrices {
            currency
            id
            interval
            intervalCount
            lookupKey
            productName
            unitAmountDecimal
        }
    }
`

export async function getCraterSubscriptionPrices() {
    const { data } = await createApolloClient().query({ query: SUBSCRIPTION_PRICES, fetchPolicy: "no-cache" })
    return normalizeSubscriptionPrices(data?.subscriptionPrices)
}
