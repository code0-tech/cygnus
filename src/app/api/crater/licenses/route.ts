import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import type { LicenseDashboardCustomer, LicenseDashboardData, LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import type { Customer, License, Mutation, MutationLicensesLinkNamespaceArgs, Query, Scalars, User } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type LicenseDetailVariables = { customerAfter?: string | null; licenseAfter?: string | null }
type LinkLicenseNamespaceData = Pick<Mutation, "licensesLinkNamespace">

function isLicenseId(value: string): value is Scalars["LicenseID"]["input"] {
    return /^gid:\/\/crater\/License\/\d+$/.test(value)
}

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const LICENSE_DASHBOARD: TypedDocumentNode<LicenseDashboardQuery, Record<string, never>> = gql`
    query LicenseDashboard {
        currentUser {
            customers(first: 100) {
                nodes {
                    id
                    customerType
                    name
                    email
                    updatedAt
                    licenses(first: 100) {
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
                        }
                    }
                }
            }
        }
    }
`

const LICENSE_NAVIGATION: TypedDocumentNode<LicenseDashboardQuery, Record<string, never>> = gql`
    query LicenseNavigation {
        currentUser {
            customers(first: 100) {
                edges {
                    cursor
                    node {
                        id
                        customerType
                        name
                        email
                        updatedAt
                        licenses(first: 100) {
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
            }
        }
    }
`

const LICENSE_CUSTOMER_DETAIL: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    query LicenseCustomerDetail($customerAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
                    id
                    customerType
                    name
                    email
                    updatedAt
                    licenses(first: 100) {
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
                        }
                    }
                }
            }
        }
    }
`

const LICENSE_DETAIL: TypedDocumentNode<LicenseDashboardQuery, LicenseDetailVariables> = gql`
    query LicenseDetail($customerAfter: String, $licenseAfter: String) {
        currentUser {
            customers(after: $customerAfter, first: 1) {
                nodes {
                    id
                    customerType
                    name
                    email
                    updatedAt
                    licenses(after: $licenseAfter, first: 1) {
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
        ...(customer.customerType ? { customerType: customer.customerType } : {}),
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.name ? { name: customer.name } : {}),
        ...(customer.updatedAt ? { updatedAt: customer.updatedAt } : {}),
        licenseCount: customer.licenses?.count ?? 0,
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
        name: licenseName(license.plan, license.id),
        ...(license.deploymentType ? { deploymentType: license.deploymentType } : {}),
        ...(license.namespaceId ? { namespaceId: license.namespaceId } : {}),
        ...(license.paymentPeriod ? { paymentPeriod: license.paymentPeriod } : {}),
        ...(license.plan ? { plan: license.plan } : {}),
        ...(license.status ? { status: license.status } : {}),
        ...(license.updatedAt ? { updatedAt: license.updatedAt } : {}),
        ...(typeof license.workflowExecutions === "number" ? { workflowExecutions: license.workflowExecutions } : {}),
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

export async function GET(request: Request) {
    const session = requireCraterSession(request, true)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const view = requestUrl.searchParams.get("view") ?? "dashboard"
    const customerId = requestUrl.searchParams.get("customerId") ?? ""
    const licenseId = requestUrl.searchParams.get("licenseId") ?? ""

    if (!(["dashboard", "customer", "license"] as const).includes(view as "dashboard" | "customer" | "license")) {
        return craterJson({ error: "view must be dashboard, customer, or license." }, 400)
    }
    if (view !== "dashboard" && !isCustomerId(customerId)) return craterJson({ error: "A valid Crater customer id is required." }, 400)
    if (view === "license" && !isLicenseId(licenseId)) return craterJson({ error: "A valid Crater license id is required." }, 400)

    try {
        const client = createApolloClient(session.token)

        if (view === "dashboard") {
            const result = await client.query({ query: LICENSE_DASHBOARD, fetchPolicy: "no-cache" })
            const currentUser = result.data?.currentUser
            if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

            return setCraterSessionCookie(craterJson(mapUserData(currentUser)), session.token)
        }

        const navigationResult = await client.query({ query: LICENSE_NAVIGATION, fetchPolicy: "no-cache" })
        const currentUser = navigationResult.data?.currentUser
        if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        const customerEdges = currentUser.customers?.edges ?? []
        const customerIndex = customerEdges.findIndex((edge) => edge?.node?.id === customerId)
        if (customerIndex < 0) return craterJson({ error: "The requested customer was not found." }, 404)

        const customerEdge = customerEdges[customerIndex]
        const customerAfter = customerIndex > 0 ? customerEdges[customerIndex - 1]?.cursor ?? null : null
        const navigationLicenses = customerEdges.flatMap((edge) => {
            const customer = edge?.node
            if (!customer) return []
            return (customer.licenses?.edges ?? []).flatMap((licenseEdge) => {
                if (!licenseEdge?.node) return []
                const mappedLicense = mapLicense(licenseEdge.node, customer)
                return mappedLicense ? [mappedLicense] : []
            })
        })
        navigationLicenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))

        let licenseAfter: string | null = null
        if (view === "license") {
            const licenseEdges = customerEdge?.node?.licenses?.edges ?? []
            const licenseIndex = licenseEdges.findIndex((edge) => edge?.node?.id === licenseId)
            if (licenseIndex < 0) return craterJson({ error: "The requested license was not found." }, 404)
            licenseAfter = licenseIndex > 0 ? licenseEdges[licenseIndex - 1]?.cursor ?? null : null
        }

        const detailResult = await client.query({
            query: view === "customer" ? LICENSE_CUSTOMER_DETAIL : LICENSE_DETAIL,
            variables: { customerAfter, ...(view === "license" ? { licenseAfter } : {}) },
            fetchPolicy: "no-cache",
        })
        const detailUser = detailResult.data?.currentUser
        if (!detailUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        const detailData = mapUserData(detailUser)
        if (detailData.customers[0]?.id !== customerId) return craterJson({ error: "The requested customer was not found." }, 404)
        if (view === "license" && detailData.licenses[0]?.id !== licenseId) return craterJson({ error: "The requested license was not found." }, 404)

        return setCraterSessionCookie(craterJson({ ...detailData, navigationLicenses } satisfies LicenseDashboardData), session.token)
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
