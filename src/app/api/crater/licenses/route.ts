import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import type { LicenseDashboardCustomer, LicenseDashboardData, LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import type { Mutation, MutationLicensesLinkNamespaceArgs, Query, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type LicenseDashboardQuery = Pick<Query, "currentUser">
type LinkLicenseNamespaceData = Pick<Mutation, "licensesLinkNamespace">

function isLicenseId(value: string): value is Scalars["LicenseID"]["input"] {
    return /^gid:\/\/crater\/License\/\d+$/.test(value)
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
                            id
                            status
                            plan
                            deploymentType
                            namespaceId
                            updatedAt
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

export async function GET(request: Request) {
    const session = requireCraterSession(request, true)
    if (session.response) return session.response

    try {
        const result = await createApolloClient(session.token).query({
            query: LICENSE_DASHBOARD,
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser

        if (!currentUser) {
            return craterJson({ error: "The Crater session has no authenticated user." }, 401)
        }

        const customers: LicenseDashboardCustomer[] = []
        const licenses: LicenseDashboardLicense[] = []

        for (const customer of currentUser.customers?.nodes ?? []) {
            if (!customer?.id) continue

            const customerId = customer.id
            const customerName = displayName(customer.name, customer.email, customerId)

            customers.push({
                id: customerId,
                ...(customer.customerType ? { customerType: customer.customerType } : {}),
                ...(customer.email ? { email: customer.email } : {}),
                ...(customer.name ? { name: customer.name } : {}),
                ...(customer.updatedAt ? { updatedAt: customer.updatedAt } : {}),
                licenseCount: customer.licenses?.count ?? 0,
            })

            for (const license of customer.licenses?.nodes ?? []) {
                if (!license?.id) continue

                licenses.push({
                    customerId,
                    customerName,
                    id: license.id,
                    name: licenseName(license.plan, license.id),
                    ...(license.deploymentType ? { deploymentType: license.deploymentType } : {}),
                    ...(license.namespaceId ? { namespaceId: license.namespaceId } : {}),
                    ...(license.plan ? { plan: license.plan } : {}),
                    ...(license.status ? { status: license.status } : {}),
                    ...(license.updatedAt ? { updatedAt: license.updatedAt } : {}),
                })
            }
        }

        licenses.sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))

        return setCraterSessionCookie(craterJson({ customers, licenses } satisfies LicenseDashboardData), session.token)
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
