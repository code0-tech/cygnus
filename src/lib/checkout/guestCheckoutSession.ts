import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import type { NextResponse } from "next/server"

export const GUEST_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000
const RECEIPT_TTL_MS = 30 * 60 * 1000
const ID_PATTERN = /^[a-f0-9]{32}$/

interface GuestCheckoutSession {
    token: string
    expiresAt: number
    email?: string
    claimToken?: string
    receipt?: { sessionId: string; licenseId: string }
}

function key() {
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) throw new Error("Guest checkout session configuration is unavailable.")
    return createHash("sha256").update(`cygnus:guest-checkout:${secret}`).digest()
}

export function guestCheckoutId(request: Request) {
    return request.headers.get("x-guest-checkout")
}

function cookieName(id: string) {
    if (!ID_PATTERN.test(id)) throw new Error("Invalid guest checkout identifier.")
    return `crater_checkout_${id}`
}

function writeSession(response: NextResponse, id: string, session: GuestCheckoutSession) {
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key(), iv)
    cipher.setAAD(Buffer.from(id))
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()])
    response.cookies.set(cookieName(id), Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url"), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/crater",
        // Browser-session cookie; the encrypted deadline also bounds restored browser sessions.
    })
    return response
}

export function createGuestCheckoutSession(response: NextResponse, id: string, token: string, claimToken?: string | null, email?: string) {
    return writeSession(response, id, { token, email, expiresAt: Date.now() + GUEST_CHECKOUT_TTL_MS, ...(claimToken ? { claimToken } : {}) })
}

export function readGuestCheckoutSession(request: Request): GuestCheckoutSession | null {
    const id = guestCheckoutId(request)
    if (!id || !ID_PATTERN.test(id)) return null
    const value = request.headers
        .get("cookie")
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${cookieName(id)}=`))
        ?.slice(cookieName(id).length + 1)
    if (!value) return null
    try {
        const data = Buffer.from(decodeURIComponent(value), "base64url")
        const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12))
        decipher.setAAD(Buffer.from(id))
        decipher.setAuthTag(data.subarray(12, 28))
        const session = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8")) as GuestCheckoutSession
        return session.expiresAt > Date.now() && typeof session.token === "string" && session.token.length > 0 ? session : null
    } catch {
        return null
    }
}

export function clearGuestCheckoutSession(response: NextResponse, request: Request) {
    const id = guestCheckoutId(request)
    if (id && ID_PATTERN.test(id)) response.cookies.set(cookieName(id), "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/crater", maxAge: 0 })
    return response
}

export function completeGuestCheckoutSession(response: NextResponse, request: Request, sessionId: string, licenseId: string) {
    const session = readGuestCheckoutSession(request)
    const id = guestCheckoutId(request)
    if (!session || !id || session.receipt) return response
    // Drop the claim and checkout access. Only confirmation and this license's download remain.
    return writeSession(response, id, { token: session.token, expiresAt: Math.min(session.expiresAt, Date.now() + RECEIPT_TTL_MS), receipt: { sessionId, licenseId } })
}

export function guestCheckoutRequestAllowed(request: Request, session: GuestCheckoutSession) {
    const url = new URL(request.url)
    if (request.method === "GET" && url.pathname === "/api/crater/auth/session") return true
    if (session.receipt) {
        return (
            (request.method === "GET" && url.pathname === "/api/crater/checkout/status" && url.searchParams.get("sessionId") === session.receipt.sessionId) ||
            (request.method === "POST" && url.pathname === "/api/crater/licenses/export")
        )
    }
    return (
        (url.pathname === "/api/crater/customer" && ["GET", "POST"].includes(request.method)) ||
        (url.pathname === "/api/crater/checkout/session" && request.method === "POST") ||
        (url.pathname === "/api/crater/checkout/discount" && request.method === "POST") ||
        (url.pathname === "/api/crater/checkout/status" && request.method === "GET")
    )
}
