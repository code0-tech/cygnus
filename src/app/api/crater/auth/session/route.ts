import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import { clearCraterSessionCookie } from "@/lib/checkout/craterSession"
import type { Mutation, MutationUsersLogoutArgs, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SessionStatusData = Pick<Query, "currentUser">
type SessionLogoutData = Pick<Mutation, "usersLogout">

const SESSION_STATUS: TypedDocumentNode<SessionStatusData, Record<string, never>> = gql`
    query CraterSessionStatus {
        currentUser {
            id
        }
    }
`

const SESSION_LOGOUT: TypedDocumentNode<SessionLogoutData, MutationUsersLogoutArgs> = gql`
    mutation CraterSessionLogout($input: UsersLogoutInput!) {
        usersLogout(input: $input) {
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

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    try {
        const result = await createApolloClient(session.token).query({
            query: SESSION_STATUS,
            fetchPolicy: "no-cache",
        })
        if (!result.data?.currentUser?.id) {
            return clearCraterSessionCookie(craterJson({ error: "The Crater session is invalid or expired." }, 401))
        }

        return craterJson({ authenticated: true })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater session status error:", error)
        return craterJson({ error: "Could not validate Crater session." }, 502)
    }
}

export async function DELETE(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SESSION_LOGOUT,
            variables: { input: {} },
        })
        const payload = result.data?.usersLogout

        if (!payload) throw new Error("Crater returned no user logout payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not revoke the user session.")
        if (errorResponse) return errorResponse

        return clearCraterSessionCookie(craterJson({ authenticated: false }))
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater session logout error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not revoke Crater session." }, 502)
    }
}
