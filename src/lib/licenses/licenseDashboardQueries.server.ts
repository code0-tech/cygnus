import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type CustomerPageVariables = { customerAfter?: string | null }
type LicenseDetailVariables = { customerAfter?: string | null; invoiceAfter?: string | null; licenseAfter?: string | null }

const PAGE_SIZE = 25
const RECENT_LICENSES_PER_CUSTOMER = 5

export const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
    query LicenseDashboard($customerAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: ${PAGE_SIZE}) {
                count
                nodes {
                    id
                    customerType
                    name
                    email
                    updatedAt
                    licenses(first: ${RECENT_LICENSES_PER_CUSTOMER}) {
                        count
                        nodes {
                            aiTokens
                            id
                            status
                            plan
                            deploymentType
                            endDate
                            namespaceId
                            paymentPeriod
                            updatedAt
                            workflowExecutions
                            subscription {
                                id
                                status
                                expireAt
                                canceledAt
                                currentPeriodEnd
                                paymentMethodId
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
                        licenses(first: ${PAGE_SIZE}) {
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

// Continues one customer's license connection past the first page. The sidebar lists every license the user
// holds, so a customer with more licenses than fit in a single page has to be walked to the end rather than
// truncated -- otherwise the sidebar count would depend on which page happens to be open.
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
                    licenses(after: $licenseAfter, first: ${PAGE_SIZE}) {
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

// Fetches full per-license detail (incl. invoices) directly during navigation, rather than trying to seek to one
// already-known license via a second, separate "after this cursor" query: Crater's StableConnection resolves
// "after" purely by comparing license ids, which silently diverges from the "most recently updated first" order
// this connection is sorted by (see CustomerType#licenses), so a synthetic seek cursor can land on the wrong row
// whenever any license anywhere has a higher id than the seek target. Walking the same connection page by page
// with real, server-issued endCursor values (as this loop does) does not have that failure mode.
export const LICENSE_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    query LicenseNavigationPage($customerAfter: String, $licenseAfter: String, $invoiceAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
                    id
                    customerType
                    name
                    email
                    updatedAt
                    licenses(after: $licenseAfter, first: ${PAGE_SIZE}) {
                        count
                        edges {
                            cursor
                            node {
                                aiTokens
                                deploymentType
                                endDate
                                id
                                namespaceId
                                paymentPeriod
                                plan
                                startDate
                                status
                                updatedAt
                                workflowExecutions
                                subscription {
                                    id
                                    status
                                    expireAt
                                    canceledAt
                                    currentPeriodEnd
                                    paymentMethodId
                                }
                                invoices(after: $invoiceAfter, first: ${PAGE_SIZE}) {
                                    count
                                    nodes {
                                        billingPeriodEnd
                                        billingPeriodStart
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
                    name
                    email
                    phone
                    updatedAt
                    licenses(after: $licenseAfter, first: ${PAGE_SIZE}) {
                        count
                        nodes {
                            aiTokens
                            deploymentType
                            endDate
                            id
                            namespaceId
                            paymentPeriod
                            plan
                            status
                            updatedAt
                            workflowExecutions
                            subscription {
                                id
                                status
                                expireAt
                                canceledAt
                                currentPeriodEnd
                                paymentMethodId
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
