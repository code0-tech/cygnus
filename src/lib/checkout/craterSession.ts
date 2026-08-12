import type { NextResponse } from "next/server"

export type CraterSessionAuthorization =
    | {
          status: "authenticated"
          token: string
      }
    | {
          status: "invalid"
      }
    | {
          status: "missing"
      }

const CRATER_SESSION_AUTHORIZATION_PATTERN = /^Session ([^\s]+)$/
const CRATER_SESSION_TOKEN_PATTERN = /^[^\s]+$/
export const CRATER_SESSION_TOKEN_QUERY_PARAM = "token"
export const CRATER_SESSION_COOKIE_NAME = "crater_session"
export const CRATER_SESSION_COOKIE_PATH = "/api/crater"

function readCookie(request: Request, name: string) {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return null

    for (const cookie of cookieHeader.split(";")) {
        const separatorIndex = cookie.indexOf("=")
        if (separatorIndex < 0 || cookie.slice(0, separatorIndex).trim() !== name) continue
        try {
            return decodeURIComponent(cookie.slice(separatorIndex + 1).trim())
        } catch {
            return ""
        }
    }

    return null
}

export function readCraterSessionToken(url: URL): string | undefined {
    const token = url.searchParams.get(CRATER_SESSION_TOKEN_QUERY_PARAM)?.trim()
    return token && CRATER_SESSION_TOKEN_PATTERN.test(token) ? token : undefined
}

export function removeCraterSessionToken(url: URL): URL {
    const sanitizedUrl = new URL(url)
    sanitizedUrl.searchParams.delete(CRATER_SESSION_TOKEN_QUERY_PARAM)
    return sanitizedUrl
}

export function readCraterSessionAuthorization(request: Request, authorizationHeaderOnly = false): CraterSessionAuthorization {
    const authorization = request.headers.get("authorization")

    if (authorizationHeaderOnly) {
        if (!authorization) return { status: "missing" }
        const match = CRATER_SESSION_AUTHORIZATION_PATTERN.exec(authorization)
        return match ? { status: "authenticated", token: match[1] } : { status: "invalid" }
    }

    const cookieToken = readCookie(request, CRATER_SESSION_COOKIE_NAME)
    if (cookieToken !== null) {
        return CRATER_SESSION_TOKEN_PATTERN.test(cookieToken) ? { status: "authenticated", token: cookieToken } : { status: "invalid" }
    }

    if (!authorization) {
        return { status: "missing" }
    }

    const match = CRATER_SESSION_AUTHORIZATION_PATTERN.exec(authorization)

    if (!match) {
        return { status: "invalid" }
    }

    return {
        status: "authenticated",
        token: match[1],
    }
}

export function setCraterSessionCookie(response: NextResponse, token: string) {
    response.cookies.set(CRATER_SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        path: CRATER_SESSION_COOKIE_PATH,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    })
    return response
}

export function clearCraterSessionCookie(response: NextResponse) {
    response.cookies.set(CRATER_SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        maxAge: 0,
        path: CRATER_SESSION_COOKIE_PATH,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    })
    return response
}
