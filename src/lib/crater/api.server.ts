import { createApolloClient } from "@/lib/apolloClient"
import { describeCraterError } from "@/lib/crater/errors"
import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/crater/session.server"
import { enforceSessionRateLimit } from "@/lib/security/rateLimiter"
import type { RateLimitPolicyName } from "@/lib/security/rateLimitPolicies"
import type { Error } from "@code0-tech/crater-graphql-types"
import { gql, type OperationVariables, type TypedDocumentNode } from "@apollo/client"
import { ServerError } from "@apollo/client/errors"
import { NextResponse } from "next/server"

export const CRATER_ERROR_FIELDS = gql`
    fragment CraterErrorFields on Error {
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
`

export function craterJson(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "cache-control": "no-store",
        },
    })
}

export function requireCraterSession(request: Request, authorizationHeaderOnly = false): { response: NextResponse; token?: never } | { response?: never; token: string } {
    const authorization = readCraterSessionAuthorization(request, authorizationHeaderOnly)

    if (authorization.status === "missing") {
        return {
            response: craterJson({ error: "Crater session authorization is required." }, 403),
        }
    }

    if (authorization.status === "invalid") {
        return {
            response: clearCraterSessionCookie(craterJson({ error: "Crater session authorization is invalid." }, 401), request),
        }
    }

    return { token: authorization.token }
}

export function noStoreRedirect(url: URL, { noReferrer = false }: { noReferrer?: boolean } = {}) {
    const response = NextResponse.redirect(url)
    response.headers.set("cache-control", "no-store")
    if (noReferrer) response.headers.set("referrer-policy", "no-referrer")
    return response
}

type CraterRouteOptions = {
    log: string
    error: string
    rateLimit?: RateLimitPolicyName
}

export function withCraterSession(options: CraterRouteOptions, handler: (request: Request, token: string) => Promise<Response>) {
    return async (request: Request): Promise<Response> => {
        const session = requireCraterSession(request)
        if (session.response) return session.response

        if (options.rateLimit) {
            const rateLimitResponse = enforceSessionRateLimit(options.rateLimit, request, session.token)
            if (rateLimitResponse) return rateLimitResponse
        }

        try {
            return await handler(request, session.token)
        } catch (error) {
            const transportResponse = craterTransportErrorResponse(error, request)
            if (transportResponse) return transportResponse

            console.error(`${options.log}:`, error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error")
            return craterJson({ error: options.error }, 502)
        }
    }
}

type CraterMutationPayload = { errors?: Error[] | null }

export async function runCraterMutation<TData, TVariables extends OperationVariables, TPayload extends CraterMutationPayload>(
    token: string,
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    selectPayload: (data: TData) => TPayload | null | undefined,
    rejectionMessage: string
): Promise<{ payload: TPayload; response?: never } | { payload?: never; response: NextResponse }> {
    const result = await createApolloClient(token).mutate<TData, TVariables>({ mutation, variables })
    const payload = result.data ? selectPayload(result.data) : null
    if (!payload) throw new Error("Crater returned no mutation payload.")

    const response = craterMutationErrorResponse(payload.errors, rejectionMessage)
    return response ? { response } : { payload }
}

export function craterMutationErrorResponse(errors: Error[] | null | undefined, message: string) {
    const described = describeCraterError(errors)
    if (!described) return null

    return craterJson({ error: message, ...described }, 422)
}

export async function runCraterResourceMutation<TData, TVariables extends OperationVariables, TPayload extends CraterMutationPayload, TResource>(
    token: string,
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    selectPayload: (data: TData) => TPayload | null | undefined,
    options: {
        rejectionMessage: string
        selectResource: (payload: TPayload) => TResource | null | undefined
        missingResourceMessage: string
        respond?: (resource: NonNullable<TResource>) => Response
    }
): Promise<Response> {
    const result = await runCraterMutation(token, mutation, variables, selectPayload, options.rejectionMessage)
    if (result.response) return result.response
    const resource = options.selectResource(result.payload)
    if (!resource) throw new Error(options.missingResourceMessage)
    return options.respond ? options.respond(resource) : craterJson(resource)
}

export function craterTransportErrorResponse(error: unknown, request?: Request) {
    if (!ServerError.is(error) || (error.statusCode !== 401 && error.statusCode !== 403)) {
        return null
    }

    const response = craterJson(
        {
            error: error.statusCode === 401 ? "The Crater session is invalid or expired." : "The Crater session is not allowed to perform this operation.",
        },
        error.statusCode
    )
    return error.statusCode === 401 ? clearCraterSessionCookie(response, request) : response
}
