import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type CustomerPageVariables = { customerAfter?: string | null }
// licenseAfter walks a customer's subscription connection: each dashboard entry is a subscription with its current license.
type LicenseDetailVariables = { customerAfter?: string | null; invoiceAfter?: string | null; licenseAfter?: string | null }

const PAGE_SIZE = 25
const RECENT_LICENSES_PER_CUSTOMER = 5

// Crater removed Customer.licenses: licenses are append-only snapshots of a subscription, so the dashboard lists
// subscriptions and reads the newest snapshot through currentLicense.
export const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
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
                            aiTokens
                            cancelAt
                            canceledAt
                            createdAt
                            currentPeriodEnd
                            currentPeriodStart
                            deploymentType
                            id
                            namespaceId
                            paymentMethodId
                            paymentPeriod
                            plan
                            status
                            updatedAt
                            workflowExecutions
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
                                    deploymentType
                                    id
                                    namespaceId
                                    plan
                                    status
                                    updatedAt
                                    currentLicense {
                                        id
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
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
`

// Continues one customer's subscription connection past the first page. The sidebar lists every subscription the
// user holds, so a customer with more subscriptions than fit in a single page has to be walked to the end rather
// than truncated -- otherwise the sidebar count would depend on which page happens to be open.
export const CUSTOMER_LICENSE_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
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
                                deploymentType
                                id
                                namespaceId
                                plan
                                status
                                updatedAt
                                currentLicense {
                                    id
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

// Fetches full per-subscription detail (incl. the current license's invoices) directly during navigation, rather
// than seeking to one already-known subscription via a synthetic "after this cursor" query: Crater's
// StableConnection resolves "after" by comparing ids, which diverges from the "most recently updated first" order
// the connection is sorted by. Walking the same connection page by page with real, server-issued endCursor values
// (as this loop does) does not have that failure mode.
export const LICENSE_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
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
                                aiTokens
                                cancelAt
                                canceledAt
                                createdAt
                                currentPeriodEnd
                                currentPeriodStart
                                deploymentType
                                id
                                namespaceId
                                paymentMethodId
                                paymentPeriod
                                plan
                                status
                                updatedAt
                                workflowExecutions
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
                            aiTokens
                            cancelAt
                            canceledAt
                            createdAt
                            currentPeriodEnd
                            currentPeriodStart
                            deploymentType
                            id
                            namespaceId
                            paymentMethodId
                            paymentPeriod
                            plan
                            status
                            updatedAt
                            workflowExecutions
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
