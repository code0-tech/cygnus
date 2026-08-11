import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import { clearCraterSessionCookie } from "@/lib/checkout/craterSession"
import type { Mutation, MutationEchoArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SessionStatusData = Pick<Mutation, "echo">

const SESSION_STATUS: TypedDocumentNode<SessionStatusData, MutationEchoArgs> = gql`
    mutation CraterSessionStatus($input: EchoInput!) {
        echo(input: $input) {
            message
            errors {
                errorCode
            }
        }
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SESSION_STATUS,
            variables: { input: { message: "session-status" } },
        })
        const payload = result.data?.echo
        if (!payload) throw new Error("Crater returned no session status payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not validate the user session.")
        if (errorResponse) return errorResponse

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
