import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, optionalString, readJsonObject } from "@/lib/craterApi"
import type { Mutation, MutationUsersLoginArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type UsersLoginData = Pick<Mutation, "usersLogin">

const USERS_LOGIN: TypedDocumentNode<UsersLoginData, MutationUsersLoginArgs> = gql`
    mutation UsersLogin($input: UsersLoginInput!) {
        usersLogin(input: $input) {
            userSession {
                active
                createdAt
                id
                token
                updatedAt
            }
            errors {
                errorCode
            }
        }
    }
`

export async function POST(request: Request) {
    const body = await readJsonObject(request)
    const sagittariusToken = optionalString(body?.sagittariusToken) ?? optionalString(process.env.CRATER_SAGITTARIUS_TOKEN)
    const clientMutationId = optionalString(body?.clientMutationId)

    if (!sagittariusToken) {
        return craterJson({ error: "sagittariusToken is required." }, 400)
    }

    try {
        const result = await createApolloClient().mutate({
            mutation: USERS_LOGIN,
            variables: {
                input: {
                    sagittariusToken,
                    ...(clientMutationId ? { clientMutationId } : {}),
                },
            },
        })
        const payload = result.data?.usersLogin

        if (!payload) {
            throw new Error("Crater returned no login payload.")
        }

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create a user session.")
        if (errorResponse) return errorResponse

        if (!payload.userSession?.token) {
            throw new Error("Crater returned no user session token.")
        }

        return craterJson(payload.userSession)
    } catch (error) {
        console.error("Crater user login error:", error)
        return craterJson({ error: "Could not create Crater session." }, 502)
    }
}
