import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import { clearCraterSessionCookie } from "@/lib/checkout/craterSession"
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

export async function DELETE() {
    return clearCraterSessionCookie(craterJson({ authenticated: false }))
}
