import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, optionalString, readJsonObject, type CraterMutationError } from "@/lib/craterApi"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type UsersLoginData = {
    usersLogin: {
        errors: CraterMutationError[]
        userSession: {
            active: boolean
            createdAt: string
            id: string
            token: string | null
            updatedAt: string
        } | null
    }
}

type UsersLoginVariables = {
    input: {
        sagittariusToken: string
    }
}

const USERS_LOGIN: TypedDocumentNode<UsersLoginData, UsersLoginVariables> = gql`
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

export async function POST(request: Request) {
    const body = await readJsonObject(request)
    const sagittariusToken = optionalString(body?.sagittariusToken)

    if (!body || !sagittariusToken) {
        return craterJson({ error: "sagittariusToken is required." }, 400)
    }

    try {
        const result = await createApolloClient().mutate({
            mutation: USERS_LOGIN,
            variables: {
                input: { sagittariusToken },
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
