import { createHash } from "node:crypto"
import { isIP } from "node:net"
import { readCraterSessionAuthorization } from "@/lib/checkout/craterSession"
import type { RateLimitPolicyName } from "@/lib/security/rateLimitPolicies"

const DEFAULT_TRUSTED_PROXY_HOPS = 1

function trustedProxyHops(environment: Readonly<Record<string, string | undefined>>) {
    const value = environment.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS
    if (!value || !/^\d+$/.test(value)) return DEFAULT_TRUSTED_PROXY_HOPS

    const parsed = Number.parseInt(value, 10)
    return Number.isSafeInteger(parsed) ? parsed : DEFAULT_TRUSTED_PROXY_HOPS
}

export function getTrustedClientIp(request: Request, environment: Readonly<Record<string, string | undefined>> = process.env) {
    const proxyHops = trustedProxyHops(environment)
    if (proxyHops === 0) return null

    const forwardedFor = request.headers.get("x-forwarded-for")
    if (forwardedFor) {
        const addresses = forwardedFor.split(",").map((address) => address.trim())
        const address = addresses.at(-proxyHops)
        return address && isIP(address) ? address : null
    }

    if (proxyHops !== 1) return null

    const realIp = request.headers.get("x-real-ip")?.trim()
    return realIp && isIP(realIp) ? realIp : null
}

function digest(value: string) {
    return createHash("sha256").update(value).digest("base64url")
}

export function createRateLimitKey(name: RateLimitPolicyName, request: Request, environment: Readonly<Record<string, string | undefined>> = process.env) {
    const session = readCraterSessionAuthorization(request)
    const identity = session.status === "authenticated" ? `session:${digest(session.token)}` : "anonymous"
    const clientIp = getTrustedClientIp(request, environment)
    const network = clientIp ? digest(clientIp) : "unknown"

    return `${name}:${identity}:network:${network}`
}
