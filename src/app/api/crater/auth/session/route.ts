import { readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { CRATER_SESSION_LOGOUT } from "@/lib/crater/logout.server"
import { clearCraterSessionCookie } from "@/lib/crater/session.server"
import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SessionStatusData = Pick<Query, "currentUser">

const SESSION_STATUS: TypedDocumentNode<SessionStatusData, Record<string, never>> = gql`
    query CraterSessionStatus {
        currentUser {
            id
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

const revokeSession = withCraterSession({ log: "Crater session logout error", error: "Could not revoke Crater session." }, async (_request, token) => {
    const mutation = await runCraterMutation(token, CRATER_SESSION_LOGOUT, { input: {} }, (data) => data.usersLogout, "Crater could not revoke the user session.")
    if (mutation.response) return mutation.response

    return craterJson({ authenticated: false })
})

export async function DELETE(request: Request) {
    const response = await revokeSession(request)
    return clearCraterSessionCookie(craterJson({ ...(await response.json()), authenticated: false }, response.status), request)
}
