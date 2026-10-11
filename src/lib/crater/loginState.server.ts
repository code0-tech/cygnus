import { randomBytes, timingSafeEqual } from "node:crypto"
import type { NextResponse } from "next/server"

// Binds a Sagittarius login callback to the browser that started it. The start route stores a random state
// in an HttpOnly cookie and appends it to the callback URL; a callback whose state does not match the
// cookie was not started by this browser (login CSRF) and must not create or use a session.

const CRATER_LOGIN_STATE_COOKIE_NAME = "crater_login_state"
const CRATER_LOGIN_STATE_COOKIE_PATH = "/api/crater"
const CRATER_LOGIN_STATE_MAX_AGE_SECONDS = 10 * 60
const CRATER_LOGIN_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const CRATER_LOGIN_STATE_PARAM = "state"

export function createCraterLoginState() {
    return randomBytes(32).toString("base64url")
}

function readLoginStateCookie(request: Request) {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return null

    for (const cookie of cookieHeader.split(";")) {
        const separatorIndex = cookie.indexOf("=")
        if (separatorIndex >= 0 && cookie.slice(0, separatorIndex).trim() === CRATER_LOGIN_STATE_COOKIE_NAME) return cookie.slice(separatorIndex + 1).trim()
    }

    return null
}

export function hasCraterLoginStateCookie(request: Request) {
    return readLoginStateCookie(request) !== null
}

export function verifyCraterLoginState(request: Request, requestUrl: URL) {
    const expected = readLoginStateCookie(request)
    const received = requestUrl.searchParams.get(CRATER_LOGIN_STATE_PARAM)
    if (!expected || !received || !CRATER_LOGIN_STATE_PATTERN.test(expected) || !CRATER_LOGIN_STATE_PATTERN.test(received)) return false

    return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

export function setCraterLoginStateCookie(response: NextResponse, state: string) {
    response.cookies.set(CRATER_LOGIN_STATE_COOKIE_NAME, state, {
        httpOnly: true,
        maxAge: CRATER_LOGIN_STATE_MAX_AGE_SECONDS,
        path: CRATER_LOGIN_STATE_COOKIE_PATH,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    })
    return response
}

// A state is single-use: every callback that received one clears it, whether the login succeeded or not.
export function clearCraterLoginStateCookie(response: NextResponse, request: Request) {
    if (!hasCraterLoginStateCookie(request)) return response
    response.cookies.set(CRATER_LOGIN_STATE_COOKIE_NAME, "", {
        httpOnly: true,
        maxAge: 0,
        path: CRATER_LOGIN_STATE_COOKIE_PATH,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    })
    return response
}
