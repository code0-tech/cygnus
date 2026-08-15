import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/checkout/craterSession"
import type { Error } from "@code0-tech/crater-graphql-types"
import { gql } from "@apollo/client"
import { ServerError } from "@apollo/client/errors"
import { NextResponse } from "next/server"

export type JsonObject = Record<string, unknown>

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

export async function readJsonObject(request: Request): Promise<JsonObject | null> {
    try {
        const body: unknown = await request.json()
        return body !== null && typeof body === "object" && !Array.isArray(body) ? (body as JsonObject) : null
    } catch {
        return null
    }
}

export function optionalString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export function readOptionalAddress(value: unknown) {
    if (value === undefined || value === null) {
        return undefined
    }

    if (typeof value !== "object" || Array.isArray(value)) {
        return null
    }

    const address = value as JsonObject

    return {
        ...(optionalString(address.city) ? { city: optionalString(address.city) } : {}),
        ...(optionalString(address.country) ? { country: optionalString(address.country) } : {}),
        ...(optionalString(address.line1) ? { line1: optionalString(address.line1) } : {}),
        ...(optionalString(address.line2) ? { line2: optionalString(address.line2) } : {}),
        ...(optionalString(address.postalCode) ? { postalCode: optionalString(address.postalCode) } : {}),
        ...(optionalString(address.state) ? { state: optionalString(address.state) } : {}),
    }
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
            response: clearCraterSessionCookie(craterJson({ error: "Crater session authorization is invalid." }, 401)),
        }
    }

    return { token: authorization.token }
}

export function craterMutationErrorResponse(errors: Error[] | null | undefined, message: string) {
    const error = errors?.[0]
    if (!error) return null

    const details =
        error.details
            ?.map((detail) => {
                if (detail.__typename === "MessageError") {
                    return detail.message ?? ""
                }

                if (detail.__typename === "ActiveModelError") {
                    return `${detail.attribute ?? "base"}: ${detail.type ?? "invalid"}`
                }

                return ""
            })
            .filter(Boolean) ?? []

    return craterJson(
        {
            error: message,
            errorCode: error.errorCode ?? "UNKNOWN",
            details,
        },
        422
    )
}

export function craterTransportErrorResponse(error: unknown) {
    if (!ServerError.is(error) || (error.statusCode !== 401 && error.statusCode !== 403)) {
        return null
    }

    const response = craterJson(
        {
            error: error.statusCode === 401 ? "The Crater session is invalid or expired." : "The Crater session is not allowed to perform this operation.",
        },
        error.statusCode
    )
    return error.statusCode === 401 ? clearCraterSessionCookie(response) : response
}
