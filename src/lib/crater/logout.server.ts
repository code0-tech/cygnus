import { CRATER_ERROR_FIELDS, runCraterMutation } from "@/lib/crater/api.server"
import type { Mutation, MutationUsersLogoutArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type SessionLogoutData = Pick<Mutation, "usersLogout">

export const CRATER_SESSION_LOGOUT: TypedDocumentNode<SessionLogoutData, MutationUsersLogoutArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CraterSessionLogout($input: UsersLogoutInput!) {
        usersLogout(input: $input) {
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function revokeCraterSession(token: string) {
    try {
        const mutation = await runCraterMutation(token, CRATER_SESSION_LOGOUT, { input: {} }, (data) => data.usersLogout, "Crater could not revoke the user session.")
        if (!mutation.response) return true
        console.error("Crater rejected the session logout.")
        return false
    } catch (error) {
        console.error("Crater session logout error:", error instanceof Error ? error.name : "Unknown error")
        return false
    }
}
