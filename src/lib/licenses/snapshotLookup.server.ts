import { createApolloClient } from "@/lib/apolloClient"
import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type LookupData = Pick<Query, "currentUser">
type LookupVariables = { customerAfter?: string; subscriptionAfter?: string; snapshotAfter?: string }

const SNAPSHOT_CUSTOMER: TypedDocumentNode<LookupData, LookupVariables> = gql`
    query LicenseSnapshotCustomer($customerAfter: String) {
        currentUser {
            customers(first: 50, after: $customerAfter) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
`

const SNAPSHOT_SUBSCRIPTION: TypedDocumentNode<LookupData, LookupVariables> = gql`
    query LicenseSnapshotSubscription($customerAfter: String, $subscriptionAfter: String, $snapshotAfter: String) {
        currentUser {
            customers(first: 1, after: $customerAfter) {
                nodes {
                    id
                    subscriptions(first: 1, after: $subscriptionAfter) {
                        nodes {
                            id
                            currentLicense {
                                id
                            }
                            licenses(first: 50, after: $snapshotAfter) {
                                nodes {
                                    id
                                }
                                pageInfo {
                                    endCursor
                                    hasNextPage
                                }
                            }
                        }
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                    }
                }
            }
        }
    }
`

function nextCursor(pageInfo: { endCursor?: string | null; hasNextPage?: boolean | null } | null | undefined, seen: Set<string>) {
    if (!pageInfo?.hasNextPage) return undefined
    if (!pageInfo.endCursor || seen.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid snapshot lookup cursor.")
    seen.add(pageInfo.endCursor)
    return pageInfo.endCursor
}

export async function findSubscriptionForLicenseSnapshot(sessionToken: string, customerId: string, licenseId: string) {
    const client = createApolloClient(sessionToken)
    const customerCursors = new Set<string>()
    let customerAfter: string | undefined
    while (true) {
        const result = await client.query({ query: SNAPSHOT_CUSTOMER, variables: { ...(customerAfter ? { customerAfter } : {}) }, fetchPolicy: "no-cache" })
        const user = result.data?.currentUser
        if (!user) return { status: "unauthenticated" as const }
        const edges = user.customers?.edges ?? []
        const index = edges.findIndex((edge) => edge?.node?.id === customerId)
        if (index >= 0) {
            customerAfter = index === 0 ? customerAfter : (edges[index - 1]?.cursor ?? undefined)
            if (index > 0 && !customerAfter) throw new Error("Crater returned an invalid customer selection cursor.")
            break
        }
        customerAfter = nextCursor(user.customers?.pageInfo, customerCursors)
        if (!customerAfter) return { status: "missing" as const }
    }

    const subscriptionCursors = new Set<string>()
    const snapshotCursors = new Set<string>()
    let subscriptionAfter: string | undefined
    let snapshotAfter: string | undefined
    let selectedSubscriptionId: string | undefined
    while (true) {
        const result = await client.query({
            query: SNAPSHOT_SUBSCRIPTION,
            variables: { ...(customerAfter ? { customerAfter } : {}), ...(subscriptionAfter ? { subscriptionAfter } : {}), ...(snapshotAfter ? { snapshotAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        if (!result.data?.currentUser) return { status: "unauthenticated" as const }
        const customer = result.data.currentUser.customers?.nodes?.[0]
        if (customer?.id !== customerId) throw new Error("Crater returned a different customer while locating a license snapshot.")
        const subscription = customer.subscriptions?.nodes?.[0]
        if (!subscription?.id) return { status: "missing" as const }
        if (selectedSubscriptionId && selectedSubscriptionId !== subscription.id) throw new Error("Crater returned a different subscription while locating a license snapshot.")
        selectedSubscriptionId = subscription.id
        if (subscription.currentLicense?.id === licenseId || subscription.licenses?.nodes?.some((snapshot) => snapshot?.id === licenseId)) {
            return { status: "found" as const, subscriptionId: subscription.id }
        }
        snapshotAfter = nextCursor(subscription.licenses?.pageInfo, snapshotCursors)
        if (snapshotAfter) continue
        subscriptionAfter = nextCursor(customer.subscriptions?.pageInfo, subscriptionCursors)
        if (!subscriptionAfter) return { status: "missing" as const }
        selectedSubscriptionId = undefined
        snapshotCursors.clear()
    }
}
