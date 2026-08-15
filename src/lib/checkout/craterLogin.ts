import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS } from "@/lib/checkout/craterApi"
import type { Mutation, MutationUsersLoginArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type UsersLoginData = Pick<Mutation, "usersLogin">

const USERS_LOGIN: TypedDocumentNode<UsersLoginData, MutationUsersLoginArgs> = gql`
    ${CRATER_ERROR_FIELDS}
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
                ...CraterErrorFields
            }
        }
    }
`

export async function createCraterUserSession(sagittariusToken: string, clientMutationId?: string) {
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
    if (!payload) throw new Error("Crater returned no login payload.")

    return payload
}
