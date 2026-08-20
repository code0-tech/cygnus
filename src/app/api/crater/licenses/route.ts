import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import type { LicenseDashboardCustomer, LicenseDashboardData, LicenseDashboardInvoice, LicenseDashboardLicense, LicenseDashboardPendingUpdate } from "@/lib/licenses/licenseTypes"
import type { Customer, Invoice, License, Mutation, MutationLicensesLinkNamespaceArgs, Query, Scalars, Subscription, SubscriptionPendingUpdate, User } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type CustomerPageVariables = { customerAfter?: string | null }
type LicenseDetailVariables = { customerAfter?: string | null; invoiceAfter?: string | null; licenseAfter?: string | null }
type LinkLicenseNamespaceData = Pick<Mutation, "licensesLinkNamespace">

const PAGE_SIZE = 25
const RECENT_LICENSES_PER_CUSTOMER = 5

function isLicenseId(value: string): value is Scalars["LicenseID"]["input"] {
    return /^gid:\/\/crater\/License\/\d+$/.test(value)
}

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
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
                            namespaceId
                            paymentPeriod
                            updatedAt
                            workflowExecutions
                            subscription {
                                id
                                status
                                cancelAt
                                canceledAt
                                currentPeriodEnd
                                pendingUpdate {
                                    plan
                                    paymentPeriod
                                    aiTokens
                                    workflowExecutions
                                    effectiveAt
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
`

const CUSTOMER_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, CustomerPageVariables> = gql`
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
                        licenses(first: ${RECENT_LICENSES_PER_CUSTOMER}) {
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

// Fetches full per-license detail (incl. invoices) directly during navigation, rather than trying to seek to one
// already-known license via a second, separate "after this cursor" query: Crater's StableConnection resolves
// "after" purely by comparing license ids, which silently diverges from the "most recently updated first" order
// this connection is sorted by (see CustomerType#licenses), so a synthetic seek cursor can land on the wrong row
// whenever any license anywhere has a higher id than the seek target. Walking the same connection page by page
// with real, server-issued endCursor values (as this loop does) does not have that failure mode.
const LICENSE_NAVIGATION_PAGE: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
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
                                    cancelAt
                                    canceledAt
                                    currentPeriodEnd
                                    pendingUpdate {
                                        plan
                                        paymentPeriod
                                        aiTokens
                                        workflowExecutions
                                        effectiveAt
                                    }
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

const LICENSE_CUSTOMER_DETAIL: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
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
                                cancelAt
                                canceledAt
                                currentPeriodEnd
                                pendingUpdate {
                                    plan
                                    paymentPeriod
                                    aiTokens
                                    workflowExecutions
                                    effectiveAt
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

const LINK_LICENSE_NAMESPACE: TypedDocumentNode<LinkLicenseNamespaceData, MutationLicensesLinkNamespaceArgs> = gql`
    mutation LicensesLinkNamespace($input: LicensesLinkNamespaceInput!) {
        licensesLinkNamespace(input: $input) {
            license {
                deploymentType
                id
                namespaceId
                updatedAt
            }
            errors {
                errorCode
                details {
                    __typename
                    ... on ActiveModelError {
                        attribute
                        type
                    }
                    ... on MessageError {
                        message
                    }
                }
            }
        }
    }
`

function displayName(name: string | null | undefined, email: string | null | undefined, id: string) {
    return name?.trim() || email?.trim() || id
}

function licenseName(plan: string | null | undefined, id: string) {
    if (!plan?.trim()) return id

    return plan
        .trim()
        .split(/[_-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function mapCustomer(customer: Customer): LicenseDashboardCustomer | null {
    if (!customer.id) return null

    return {
        id: customer.id,
        ...(customer.address
            ? {
                  address: {
                      ...(customer.address.city ? { city: customer.address.city } : {}),
                      ...(customer.address.country ? { country: customer.address.country } : {}),
                      ...(customer.address.line1 ? { line1: customer.address.line1 } : {}),
                      ...(customer.address.line2 ? { line2: customer.address.line2 } : {}),
                      ...(customer.address.postalCode ? { postalCode: customer.address.postalCode } : {}),
                      ...(customer.address.state ? { state: customer.address.state } : {}),
                  },
              }
            : {}),
        ...(customer.customerType ? { customerType: customer.customerType } : {}),
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.name ? { name: customer.name } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        ...(customer.updatedAt ? { updatedAt: customer.updatedAt } : {}),
        licenseCount: customer.licenses?.count ?? 0,
    }
}

function mapInvoice(invoice: Invoice): LicenseDashboardInvoice | null {
    if (!invoice.id) return null

    return {
        id: invoice.id,
        ...(invoice.billingPeriodEnd ? { billingPeriodEnd: invoice.billingPeriodEnd } : {}),
        ...(invoice.billingPeriodStart ? { billingPeriodStart: invoice.billingPeriodStart } : {}),
        ...(invoice.currency ? { currency: invoice.currency } : {}),
        ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
        ...(invoice.status ? { status: invoice.status } : {}),
        ...(invoice.stripePdfUrl ? { stripePdfUrl: invoice.stripePdfUrl } : {}),
        ...(typeof invoice.total === "number" ? { total: invoice.total } : {}),
    }
}

function mapPendingUpdate(pendingUpdate: SubscriptionPendingUpdate | null | undefined): LicenseDashboardPendingUpdate | undefined {
    if (!pendingUpdate) return undefined

    return {
        ...(pendingUpdate.plan ? { plan: pendingUpdate.plan } : {}),
        ...(pendingUpdate.paymentPeriod ? { paymentPeriod: pendingUpdate.paymentPeriod } : {}),
        ...(typeof pendingUpdate.aiTokens === "number" ? { aiTokens: pendingUpdate.aiTokens } : {}),
        ...(typeof pendingUpdate.workflowExecutions === "number" ? { workflowExecutions: pendingUpdate.workflowExecutions } : {}),
        ...(pendingUpdate.effectiveAt ? { effectiveAt: pendingUpdate.effectiveAt } : {}),
    }
}

function mapSubscriptionFields(subscription: Subscription | null | undefined): Partial<LicenseDashboardLicense> {
    if (!subscription?.id) return {}

    return {
        subscriptionId: subscription.id,
        ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
        ...(subscription.cancelAt ? { cancelAt: subscription.cancelAt } : {}),
        ...(subscription.canceledAt ? { canceledAt: subscription.canceledAt } : {}),
        ...(subscription.currentPeriodEnd ? { currentPeriodEnd: subscription.currentPeriodEnd } : {}),
        ...(mapPendingUpdate(subscription.pendingUpdate) ? { pendingUpdate: mapPendingUpdate(subscription.pendingUpdate) } : {}),
    }
}

function mapLicense(license: License, customer: Customer): LicenseDashboardLicense | null {
    if (!customer.id || !license.id) return null

    return {
        ...(typeof license.aiTokens === "number" ? { aiTokens: license.aiTokens } : {}),
        customerId: customer.id,
        customerName: displayName(customer.name, customer.email, customer.id),
        ...(customer.customerType ? { customerType: customer.customerType } : {}),
        id: license.id,
        ...(license.invoices?.nodes
            ? { invoices: license.invoices.nodes.flatMap((invoice) => (invoice ? [mapInvoice(invoice)].filter((mapped): mapped is LicenseDashboardInvoice => mapped !== null) : [])) }
            : {}),
        name: licenseName(license.plan, license.id),
        ...(license.deploymentType ? { deploymentType: license.deploymentType } : {}),
        ...(license.namespaceId ? { namespaceId: license.namespaceId } : {}),
        ...(license.paymentPeriod ? { paymentPeriod: license.paymentPeriod } : {}),
        ...(license.plan ? { plan: license.plan } : {}),
        ...(license.startDate ? { startDate: license.startDate } : {}),
        ...(license.status ? { status: license.status } : {}),
        ...(license.updatedAt ? { updatedAt: license.updatedAt } : {}),
        ...(typeof license.workflowExecutions === "number" ? { workflowExecutions: license.workflowExecutions } : {}),
        ...mapSubscriptionFields(license.subscription),
    }
}

function mapUserData(currentUser: User): LicenseDashboardData {
    const customers: LicenseDashboardCustomer[] = []
    const licenses: LicenseDashboardLicense[] = []

    for (const customer of currentUser.customers?.nodes ?? []) {
        if (!customer) continue
        const mappedCustomer = mapCustomer(customer)
        if (mappedCustomer) customers.push(mappedCustomer)

        for (const license of customer.licenses?.nodes ?? []) {
            if (!license) continue
            const mappedLicense = mapLicense(license, customer)
            if (mappedLicense) licenses.push(mappedLicense)
        }
    }

    licenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))
    return { customers, licenses }
}

function mapPageInfo(pageInfo: { endCursor?: string | null; hasNextPage?: boolean | null } | null | undefined, totalCount?: number | null) {
    return {
        endCursor: pageInfo?.endCursor ?? null,
        hasNextPage: pageInfo?.hasNextPage === true,
        ...(typeof totalCount === "number" ? { totalCount } : {}),
    }
}

function readCursor(requestUrl: URL, name: string) {
    const value = requestUrl.searchParams.get(name)?.trim()
    if (!value) return null
    return value.length <= 2_048 ? value : undefined
}

function appendNavigationLicenses(target: LicenseDashboardLicense[], customer: Customer) {
    for (const license of customer.licenses?.edges ?? []) {
        if (!license?.node) continue
        const mappedLicense = mapLicense(license.node, customer)
        if (mappedLicense && !target.some((candidate) => candidate.id === mappedLicense.id)) target.push(mappedLicense)
    }
}

async function findCustomerCursor(client: ReturnType<typeof createApolloClient>, customerId: string) {
    const seenCursors = new Set<string>()
    const navigationLicenses: LicenseDashboardLicense[] = []
    let customerAfter: string | null = null

    while (true) {
        const result = await client.query({
            query: CUSTOMER_NAVIGATION_PAGE,
            variables: { ...(customerAfter ? { customerAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser
        if (!currentUser) return { status: "unauthenticated" as const }

        const connection = currentUser.customers
        const edges = connection?.edges ?? []
        for (let index = 0; index < edges.length; index += 1) {
            const edge = edges[index]
            const customer = edge?.node
            if (!customer) continue
            appendNavigationLicenses(navigationLicenses, customer)
            if (customer.id === customerId) {
                return {
                    status: "found" as const,
                    customerAfter: index > 0 ? (edges[index - 1]?.cursor ?? null) : customerAfter,
                    navigationLicenses,
                }
            }
        }

        const pageInfo = mapPageInfo(connection?.pageInfo)
        if (!pageInfo.hasNextPage) return { status: "missing" as const }
        if (!pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid customer pagination cursor.")
        seenCursors.add(pageInfo.endCursor)
        customerAfter = pageInfo.endCursor
    }
}

async function findLicenseCursor(client: ReturnType<typeof createApolloClient>, customerAfter: string | null, customerId: string, licenseId: string, invoiceAfter: string | null) {
    const seenCursors = new Set<string>()
    let licenseAfter: string | null = null

    while (true) {
        const result = await client.query({
            query: LICENSE_NAVIGATION_PAGE,
            variables: { ...(customerAfter ? { customerAfter } : {}), ...(licenseAfter ? { licenseAfter } : {}), ...(invoiceAfter ? { invoiceAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const customer = result.data?.currentUser?.customers?.nodes?.[0]
        if (!customer) return { status: "missing" as const }
        if (customer.id !== customerId) return { status: "missing" as const }

        const edges = customer.licenses?.edges ?? []
        const matchedLicense = edges.find((edge) => edge?.node?.id === licenseId)?.node
        if (matchedLicense) {
            return { status: "found" as const, customer, license: matchedLicense }
        }

        const pageInfo = mapPageInfo(customer.licenses?.pageInfo)
        if (!pageInfo.hasNextPage) return { status: "missing" as const }
        if (!pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid license pagination cursor.")
        seenCursors.add(pageInfo.endCursor)
        licenseAfter = pageInfo.endCursor
    }
}

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const view = requestUrl.searchParams.get("view") ?? "dashboard"
    const customerId = requestUrl.searchParams.get("customerId") ?? ""
    const licenseId = requestUrl.searchParams.get("licenseId") ?? ""
    const customerAfter = readCursor(requestUrl, "customerAfter")
    const licenseAfter = readCursor(requestUrl, "licenseAfter")
    const invoiceAfter = readCursor(requestUrl, "invoiceAfter")

    if (!(["dashboard", "customer", "license"] as const).includes(view as "dashboard" | "customer" | "license")) {
        return craterJson({ error: "view must be dashboard, customer, or license." }, 400)
    }
    if (view !== "dashboard" && !isCustomerId(customerId)) return craterJson({ error: "A valid Crater customer id is required." }, 400)
    if (view === "license" && !isLicenseId(licenseId)) return craterJson({ error: "A valid Crater license id is required." }, 400)
    if (customerAfter === undefined || licenseAfter === undefined || invoiceAfter === undefined) return craterJson({ error: "The pagination cursor is invalid." }, 400)

    try {
        const client = createApolloClient(session.token)

        if (view === "dashboard") {
            const result = await client.query({
                query: LICENSE_DASHBOARD,
                variables: { ...(customerAfter ? { customerAfter } : {}) },
                fetchPolicy: "no-cache",
            })
            const currentUser = result.data?.currentUser
            if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

            return setCraterSessionCookie(
                craterJson({
                    ...mapUserData(currentUser),
                    pagination: { customers: mapPageInfo(currentUser.customers?.pageInfo, currentUser.customers?.count) },
                } satisfies LicenseDashboardData),
                session.token
            )
        }

        const customerLookup = await findCustomerCursor(client, customerId)
        if (customerLookup.status === "unauthenticated") return craterJson({ error: "The Crater session has no authenticated user." }, 401)
        if (customerLookup.status === "missing") return craterJson({ error: "The requested customer was not found." }, 404)

        if (view === "license") {
            const licenseLookup = await findLicenseCursor(client, customerLookup.customerAfter, customerId, licenseId, invoiceAfter)
            if (licenseLookup.status === "missing") return craterJson({ error: "The requested license was not found." }, 404)

            const navigationLicenses = [...customerLookup.navigationLicenses]

            const mappedCustomer = mapCustomer(licenseLookup.customer)
            const mappedLicense = mapLicense(licenseLookup.license, licenseLookup.customer)
            if (!mappedCustomer || !mappedLicense) return craterJson({ error: "Crater returned incomplete license data." }, 502)
            if (!navigationLicenses.some((candidate) => candidate.id === mappedLicense.id)) navigationLicenses.push(mappedLicense)
            navigationLicenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))

            return setCraterSessionCookie(
                craterJson({
                    customers: [mappedCustomer],
                    licenses: [mappedLicense],
                    navigationLicenses,
                    pagination: { invoices: mapPageInfo(licenseLookup.license.invoices?.pageInfo, licenseLookup.license.invoices?.count) },
                } satisfies LicenseDashboardData),
                session.token
            )
        }

        const navigationLicenses = customerLookup.navigationLicenses
        navigationLicenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))

        const detailResult = await client.query({
            query: LICENSE_CUSTOMER_DETAIL,
            variables: {
                ...(customerLookup.customerAfter ? { customerAfter: customerLookup.customerAfter } : {}),
                ...(licenseAfter ? { licenseAfter } : {}),
            },
            fetchPolicy: "no-cache",
        })
        const detailUser = detailResult.data?.currentUser
        if (!detailUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        const detailData = mapUserData(detailUser)
        if (detailData.customers[0]?.id !== customerId) return craterJson({ error: "The requested customer was not found." }, 404)

        const detailCustomer = detailUser.customers?.nodes?.[0]
        const pagination = { licenses: mapPageInfo(detailCustomer?.licenses?.pageInfo, detailCustomer?.licenses?.count) }

        return setCraterSessionCookie(craterJson({ ...detailData, navigationLicenses, pagination } satisfies LicenseDashboardData), session.token)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater license dashboard error:", error)
        return craterJson({ error: "Could not load license dashboard data from Crater." }, 502)
    }
}

export async function PATCH(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    const namespaceId = optionalString(body?.namespaceId)

    if (!id || !isLicenseId(id) || !namespaceId) {
        return craterJson({ error: "A valid Crater license id and namespaceId are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: LINK_LICENSE_NAMESPACE,
            variables: { input: { id, namespaceId } },
        })
        const payload = result.data?.licensesLinkNamespace
        if (!payload) throw new Error("Crater returned no license namespace payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not link the license namespace.")
        if (errorResponse) return errorResponse
        if (!payload.license) throw new Error("Crater returned no linked license.")

        return craterJson(payload.license)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater license namespace error:", error)
        return craterJson({ error: "Could not link the Crater license namespace." }, 502)
    }
}
