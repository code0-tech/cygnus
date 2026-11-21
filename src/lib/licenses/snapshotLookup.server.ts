import { createApolloClient } from "@/lib/apolloClient"
import { normalizeCraterCustomerType } from "@/lib/crater/values"
import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

// A user manages a single customer (`currentUser.customer`), so the lookups only page through that customer's
// subscriptions, snapshots and invoices. A `customerId` taken from a URL must name exactly that customer.
type LookupData = Pick<Query, "currentUser">
type LookupVariables = { subscriptionAfter?: string; snapshotAfter?: string }

const SNAPSHOT_SUBSCRIPTION: TypedDocumentNode<LookupData, LookupVariables> = gql`
    query LicenseSnapshotSubscription($subscriptionAfter: String, $snapshotAfter: String) {
        currentUser {
            customer {
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
`

type SubscriptionCustomerVariables = { subscriptionAfter?: string }

const SUBSCRIPTION_CUSTOMER: TypedDocumentNode<LookupData, SubscriptionCustomerVariables> = gql`
    query LicenseSubscriptionCustomer($subscriptionAfter: String) {
        currentUser {
            customer {
                id
                customerType
                subscriptions(first: 50, after: $subscriptionAfter) {
                    nodes {
                        id
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        }
    }
`

type InvoiceLookupVariables = { subscriptionAfter?: string; invoiceAfter?: string }

const INVOICE_SUBSCRIPTION_POSITION: TypedDocumentNode<LookupData, SubscriptionCustomerVariables> = gql`
    query InvoiceSubscriptionPosition($subscriptionAfter: String) {
        currentUser {
            customer {
                id
                subscriptions(first: 50, after: $subscriptionAfter) {
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
    }
`

const INVOICE_PDF_URL: TypedDocumentNode<LookupData, InvoiceLookupVariables> = gql`
    query InvoicePdfUrl($subscriptionAfter: String, $invoiceAfter: String) {
        currentUser {
            customer {
                id
                subscriptions(first: 1, after: $subscriptionAfter) {
                    nodes {
                        id
                        currentLicense {
                            invoices(first: 50, after: $invoiceAfter) {
                                nodes {
                                    id
                                    stripePdfUrl
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
        }
    }
`

function nextCursor(pageInfo: { endCursor?: string | null; hasNextPage?: boolean | null } | null | undefined, seen: Set<string>) {
    if (!pageInfo?.hasNextPage) return undefined
    if (!pageInfo.endCursor || seen.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid snapshot lookup cursor.")
    seen.add(pageInfo.endCursor)
    return pageInfo.endCursor
}

// Every cursor is checked for repeats, but a Crater that keeps returning fresh ones would still page forever. Lookups
// step through subscriptions one at a time, so the budget leaves room for large accounts.
const MAX_LOOKUP_QUERIES = 250

function createLookupClient(sessionToken: string) {
    const client = createApolloClient(sessionToken)
    let remaining = MAX_LOOKUP_QUERIES
    const query = ((options: Parameters<typeof client.query>[0]) => {
        if (remaining <= 0) return Promise.reject(new Error("Crater snapshot lookup exceeded its query budget."))
        remaining -= 1
        return client.query(options)
    }) as typeof client.query
    return { query }
}

export async function findSubscriptionForLicenseSnapshot(sessionToken: string, customerId: string, licenseId: string) {
    const client = createLookupClient(sessionToken)
    const subscriptionCursors = new Set<string>()
    const snapshotCursors = new Set<string>()
    let subscriptionAfter: string | undefined
    let snapshotAfter: string | undefined
    let selectedSubscriptionId: string | undefined
    while (true) {
        const result = await client.query({
            query: SNAPSHOT_SUBSCRIPTION,
            variables: { ...(subscriptionAfter ? { subscriptionAfter } : {}), ...(snapshotAfter ? { snapshotAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        if (!result.data?.currentUser) return { status: "unauthenticated" as const }
        const customer = result.data.currentUser.customer
        if (customer?.id !== customerId) return { status: "missing" as const }
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

// Crater has no root subscription lookup, so the subscription is found by paging through the subscriptions of the
// user's customer.
export async function findCustomerForSubscription(sessionToken: string, subscriptionId: string) {
    const client = createLookupClient(sessionToken)
    const subscriptionCursors = new Set<string>()
    let subscriptionAfter: string | undefined
    let selectedCustomerId: string | undefined
    while (true) {
        const result = await client.query({
            query: SUBSCRIPTION_CUSTOMER,
            variables: { ...(subscriptionAfter ? { subscriptionAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const user = result.data?.currentUser
        if (!user) return { status: "unauthenticated" as const }
        const customer = user.customer
        if (!customer?.id) return { status: "missing" as const }
        if (selectedCustomerId && selectedCustomerId !== customer.id) throw new Error("Crater returned a different customer while locating a subscription.")
        selectedCustomerId = customer.id
        if (customer.subscriptions?.nodes?.some((subscription) => subscription?.id === subscriptionId)) {
            return { status: "found" as const, customerId: customer.id, customerType: normalizeCraterCustomerType(customer.customerType) }
        }
        subscriptionAfter = nextCursor(customer.subscriptions?.pageInfo, subscriptionCursors)
        if (!subscriptionAfter) return { status: "missing" as const }
    }
}

export async function findInvoicePdfUrl(sessionToken: string, customerId: string, subscriptionId: string, invoiceId: string) {
    const client = createLookupClient(sessionToken)
    const subscriptionCursors = new Set<string>()
    let subscriptionPageAfter: string | undefined
    let subscriptionAfter: string | undefined
    while (true) {
        const result = await client.query({
            query: INVOICE_SUBSCRIPTION_POSITION,
            variables: { ...(subscriptionPageAfter ? { subscriptionAfter: subscriptionPageAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        if (!result.data?.currentUser) return { status: "unauthenticated" as const }
        const customer = result.data.currentUser.customer
        if (customer?.id !== customerId) return { status: "missing" as const }
        const edges = customer.subscriptions?.edges ?? []
        const index = edges.findIndex((edge) => edge?.node?.id === subscriptionId)
        if (index >= 0) {
            subscriptionAfter = index === 0 ? subscriptionPageAfter : (edges[index - 1]?.cursor ?? undefined)
            if (index > 0 && !subscriptionAfter) throw new Error("Crater returned an invalid subscription selection cursor.")
            break
        }
        subscriptionPageAfter = nextCursor(customer.subscriptions?.pageInfo, subscriptionCursors)
        if (!subscriptionPageAfter) return { status: "missing" as const }
    }

    const invoiceCursors = new Set<string>()
    let invoiceAfter: string | undefined
    while (true) {
        const result = await client.query({
            query: INVOICE_PDF_URL,
            variables: { ...(subscriptionAfter ? { subscriptionAfter } : {}), ...(invoiceAfter ? { invoiceAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        if (!result.data?.currentUser) return { status: "unauthenticated" as const }
        const customer = result.data.currentUser.customer
        if (customer?.id !== customerId) throw new Error("Crater returned a different customer while locating an invoice.")
        const subscription = customer.subscriptions?.nodes?.[0]
        if (subscription?.id !== subscriptionId) throw new Error("Crater returned a different subscription while locating an invoice.")
        const invoices = subscription.currentLicense?.invoices
        const invoice = invoices?.nodes?.find((candidate) => candidate?.id === invoiceId)
        if (invoice) return invoice.stripePdfUrl ? { status: "found" as const, stripePdfUrl: invoice.stripePdfUrl } : { status: "missing" as const }
        invoiceAfter = nextCursor(invoices?.pageInfo, invoiceCursors)
        if (!invoiceAfter) return { status: "missing" as const }
    }
}
