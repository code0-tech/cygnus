import { describeCraterError } from "@/lib/crater/errors"
import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/crater/session.server"
import type { Error } from "@code0-tech/crater-graphql-types"
import { gql } from "@apollo/client"
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

export function craterMutationErrorResponse(errors: Error[] | null | undefined, message: string) {
    const described = describeCraterError(errors)
    if (!described) return null

    return craterJson({ error: message, ...described }, 422)
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
