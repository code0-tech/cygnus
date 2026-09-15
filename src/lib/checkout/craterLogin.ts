import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS } from "@/lib/checkout/craterApi"
import type { Mutation, MutationUsersCreateGuestUserArgs, MutationUsersLoginArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type UsersLoginData = Pick<Mutation, "usersLogin">
type UsersCreateGuestUserData = Pick<Mutation, "usersCreateGuestUser">

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

const USERS_CREATE_GUEST_USER: TypedDocumentNode<UsersCreateGuestUserData, MutationUsersCreateGuestUserArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation UsersCreateGuestUser($input: UsersCreateGuestUserInput!) {
        usersCreateGuestUser(input: $input) {
            claimToken
            userSession {
                id
                token
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function createCraterGuestUser(email: string, clientMutationId?: string) {
    const result = await createApolloClient().mutate({
        mutation: USERS_CREATE_GUEST_USER,
        variables: {
            input: {
                email,
                ...(clientMutationId ? { clientMutationId } : {}),
            },
        },
    })
    const payload = result.data?.usersCreateGuestUser
    if (!payload) throw new Error("Crater returned no guest user payload.")

    return payload
}

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
