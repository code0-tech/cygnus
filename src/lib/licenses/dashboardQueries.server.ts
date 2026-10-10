import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type CustomerPageVariables = { customerAfter?: string | null }
type LicenseDetailVariables = { customerAfter?: string | null; invoiceAfter?: string | null; licenseAfter?: string | null }

const PAGE_SIZE = 25
const RECENT_LICENSES_PER_CUSTOMER = 5

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

export const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
    ${SUBSCRIPTION_FIELDS}
    query LicenseDashboard($customerAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: ${PAGE_SIZE}) {
                count
                nodes {
                    id
                    customerType
                    checkoutLimits {
                        aiTokens
                        workflowExecutions
                    }
                    name
                    email
                    updatedAt
                    subscriptions(first: ${RECENT_LICENSES_PER_CUSTOMER}) {
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
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
`

export const CUSTOMER_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
    ${NAVIGATION_SUBSCRIPTION_FIELDS}
    query CustomerNavigationPage($customerAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: ${PAGE_SIZE}) {
                edges {
                    cursor
                    node {
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
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
`

export const CUSTOMER_LICENSE_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${NAVIGATION_SUBSCRIPTION_FIELDS}
    query CustomerLicensePage($customerAfter: String, $licenseAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
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
    }
`

export const LICENSE_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${SUBSCRIPTION_FIELDS}
    query LicenseNavigationPage($customerAfter: String, $licenseAfter: String, $invoiceAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
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
    }
`

export const LICENSE_CUSTOMER_DETAIL: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    ${SUBSCRIPTION_FIELDS}
    query LicenseCustomerDetail($customerAfter: String, $licenseAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
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
    }
`
