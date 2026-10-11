import { readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { clearCraterSessionCookie } from "@/lib/crater/session.server"
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
    ${CRATER_ERROR_FIELDS}
    mutation CraterSessionLogout($input: UsersLogoutInput!) {
        usersLogout(input: $input) {
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const GET = withCraterSession({ log: "Crater session status error", error: "Could not validate Crater session." }, async (request, token) => {
    const result = await createApolloClient(token).query({
        query: SESSION_STATUS,
        fetchPolicy: "no-cache",
    })
    if (!result.data?.currentUser?.id) {
        return clearCraterSessionCookie(craterJson({ error: "The Crater session is invalid or expired." }, 401), request)
    }

    const guestEmail = readGuestCheckoutSession(request)?.email
    return craterJson({ authenticated: true, ...(guestEmail ? { guestEmail } : {}) })
})

export const DELETE = withCraterSession({ log: "Crater session logout error", error: "Could not revoke Crater session." }, async (_request, token) => {
    const mutation = await runCraterMutation(token, SESSION_LOGOUT, { input: {} }, (data) => data.usersLogout, "Crater could not revoke the user session.")
    if (mutation.response) return mutation.response

    return clearCraterSessionCookie(craterJson({ authenticated: false }))
})
