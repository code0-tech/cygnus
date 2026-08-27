import { createApolloClient } from "@/lib/apolloClient"
import { normalizeSubscriptionPrices, SUBSCRIPTION_PRICE_LOOKUP_KEYS } from "@/lib/subscriptionPrices"
import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { unstable_cache } from "next/cache"
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

async function fetchCraterSubscriptionPrices() {
    const { data } = await createApolloClient().query({ query: SUBSCRIPTION_PRICES, fetchPolicy: "no-cache" })
    return normalizeSubscriptionPrices(data?.subscriptionPrices)
}

export const getCraterSubscriptionPrices = unstable_cache(fetchCraterSubscriptionPrices, ["crater-subscription-prices", ...SUBSCRIPTION_PRICE_LOOKUP_KEYS], {
    revalidate: 60,
})
