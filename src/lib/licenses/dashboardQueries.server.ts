import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { SUBSCRIPTION_USAGE_FIELDS } from "@/lib/crater/subscriptionFragments"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type LicenseDetailVariables = { invoiceAfter?: string | null; licenseAfter?: string | null }

const PAGE_SIZE = 25
const RECENT_LICENSES = 5

const NAMESPACE_FIELDS = gql`
    fragment LicenseDashboardNamespaceFields on Namespace {
        id
        parent {
            __typename
            ... on NamespaceOrganization {
                name
            }
            ... on NamespaceUser {
                username
            }
        }
    }
`

const SUBSCRIPTION_FIELDS = gql`
    ${NAMESPACE_FIELDS}
    fragment LicenseDashboardSubscriptionFields on Subscription {
        aiTokens
        cancelAt
        canceledAt
        createdAt
        currentPeriodEnd
        currentPeriodStart
        deploymentType
        id
        namespace {
            ...LicenseDashboardNamespaceFields
        }
        immediateCancellationAvailable
        immediateCancellationUntil
        paymentMethodId
        paymentPeriod
        plan
        status
        updatedAt
        workflowExecutions
        pendingUpdate {
            plan
            paymentPeriod
            aiTokens
            workflowExecutions
            effectiveAt
        }
    }
`

const NAVIGATION_SUBSCRIPTION_FIELDS = gql`
    ${NAMESPACE_FIELDS}
    fragment LicenseNavigationSubscriptionFields on Subscription {
        deploymentType
        id
        namespace {
            ...LicenseDashboardNamespaceFields
        }
        plan
        status
        updatedAt
        currentLicense {
            id
        }
    }
`

export const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, Record<string, never>> = gql`
    ${SUBSCRIPTION_FIELDS}
    query LicenseDashboard {
        currentUser {
            customer {
                id
                customerType
                checkoutLimits {
                    aiTokens
                    workflowExecutions
                }
                name
                email
                updatedAt
                subscriptions(first: ${RECENT_LICENSES}) {
                    count
                    nodes {
                        ...LicenseDashboardSubscriptionFields
                        currentLicense {
                            endDate
                            id
                            startDate
                        }
                    }
                }
            }
        }
    }
`

export const CUSTOMER_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, Record<string, never>> = gql`
    ${NAVIGATION_SUBSCRIPTION_FIELDS}
    query CustomerNavigationPage {
        currentUser {
            customer {
                id
                customerType
                name
                email
                updatedAt
                subscriptions(first: ${PAGE_SIZE}) {
                    count
                    edges {
                        cursor
                        node {
                            ...LicenseNavigationSubscriptionFields
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

export const CUSTOMER_LICENSE_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${NAVIGATION_SUBSCRIPTION_FIELDS}
    query CustomerLicensePage($licenseAfter: String) {
        currentUser {
            customer {
                id
                customerType
                name
                email
                updatedAt
                subscriptions(after: $licenseAfter, first: ${PAGE_SIZE}) {
                    count
                    edges {
                        cursor
                        node {
                            ...LicenseNavigationSubscriptionFields
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

export const LICENSE_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${SUBSCRIPTION_FIELDS}
    ${SUBSCRIPTION_USAGE_FIELDS}
    query LicenseNavigationPage($licenseAfter: String, $invoiceAfter: String) {
        currentUser {
            customer {
                id
                customerType
                checkoutLimits {
                    aiTokens
                    workflowExecutions
                }
                name
                email
                updatedAt
                subscriptions(after: $licenseAfter, first: ${PAGE_SIZE}) {
                    count
                    edges {
                        cursor
                        node {
                            ...LicenseDashboardSubscriptionFields
                            usage {
                                ...SubscriptionUsageFields
                            }
                            currentLicense {
                                endDate
                                id
                                startDate
                                invoices(after: $invoiceAfter, first: ${PAGE_SIZE}) {
                                    count
                                    nodes {
                                        createdAt
                                        currency
                                        id
                                        invoiceNumber
                                        status
                                        stripePdfUrl
                                        net
                                        tax
                                        lineItems {
                                            amount
                                            description
                                            quantity
                                        }
                                        total
                                    }
                                    pageInfo {
                                        endCursor
                                        hasNextPage
                                    }
                                }
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

export const LICENSE_CUSTOMER_DETAIL: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${SUBSCRIPTION_FIELDS}
    query LicenseCustomerDetail($licenseAfter: String) {
        currentUser {
            customer {
                address {
                    city
                    country
                    line1
                    line2
                    postalCode
                    state
                }
                id
                customerType
                checkoutLimits {
                    aiTokens
                    workflowExecutions
                }
                name
                email
                phone
                updatedAt
                subscriptions(after: $licenseAfter, first: ${PAGE_SIZE}) {
                    count
                    nodes {
                        ...LicenseDashboardSubscriptionFields
                        currentLicense {
                            endDate
                            id
                            startDate
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
