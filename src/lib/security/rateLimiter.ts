import { createRateLimitKey } from "@/lib/security/rateLimitKey"
import { getRateLimitPolicy, type RateLimitPolicy, type RateLimitPolicyName } from "@/lib/security/rateLimitPolicies"
import { logSecurityEvent } from "@/lib/security/securityLog"

interface RateLimitBucket {
    count: number
    rejectionLogged: boolean
    resetAt: number
}

export interface RateLimitResult {
    allowed: boolean
    limit: number
    remaining: number
    resetSeconds: number
    shouldLog: boolean
}

const DEFAULT_MAX_BUCKETS = 10_000

export class InMemoryRateLimiter {
    private readonly buckets = new Map<string, RateLimitBucket>()

    constructor(
        private readonly maxBuckets = DEFAULT_MAX_BUCKETS,
        private readonly now: () => number = Date.now
    ) {}

    consume(key: string, policy: RateLimitPolicy): RateLimitResult {
        const now = this.now()
        const current = this.buckets.get(key)

        if (!current || current.resetAt <= now) {
            this.makeRoom(now)
            this.buckets.set(key, { count: 1, rejectionLogged: false, resetAt: now + policy.windowSeconds * 1000 })
            return { allowed: true, limit: policy.max, remaining: policy.max - 1, resetSeconds: policy.windowSeconds, shouldLog: false }
        }

        const resetSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
        if (current.count >= policy.max) {
            const shouldLog = !current.rejectionLogged
            current.rejectionLogged = true
            return { allowed: false, limit: policy.max, remaining: 0, resetSeconds, shouldLog }
        }

        current.count += 1
        return { allowed: true, limit: policy.max, remaining: policy.max - current.count, resetSeconds, shouldLog: false }
    }

    private makeRoom(now: number) {
        if (this.buckets.size < this.maxBuckets) return

        for (const [key, bucket] of this.buckets) {
            if (bucket.resetAt <= now) this.buckets.delete(key)
        }

        while (this.buckets.size >= this.maxBuckets) {
            const oldestKey = this.buckets.keys().next().value as string | undefined
            if (!oldestKey) break
            this.buckets.delete(oldestKey)
        }
    }
}

const limiter = new InMemoryRateLimiter()

// Requests without a trusted client address share one bucket per policy. Its higher limit keeps a single
// source from locking out every such user too quickly, while still capping abuse (e.g. guest e-mail spam)
// when the deployment fails to surface a trusted IP.
const UNTRUSTED_NETWORK_LIMIT_MULTIPLIER = 10
const untrustedNetworkWarnings = new Set<RateLimitPolicyName>()

export function enforceRateLimit(name: RateLimitPolicyName, request: Request) {
    const clientKey = createRateLimitKey(name, request)
    const policy = getRateLimitPolicy(name)
    const key = clientKey ?? `${name}:network:untrusted`

    if (!clientKey && !untrustedNetworkWarnings.has(name)) {
        untrustedNetworkWarnings.add(name)
        logSecurityEvent({ event: "rate_limit_untrusted_network", policy: name })
    }

    const result = limiter.consume(key, clientKey ? policy : { ...policy, max: policy.max * UNTRUSTED_NETWORK_LIMIT_MULTIPLIER })
    if (result.allowed) return null

    if (result.shouldLog) {
        logSecurityEvent({
            event: "rate_limit_exceeded",
            policy: name,
            limit: result.limit,
            retryAfterSeconds: result.resetSeconds,
            network: clientKey ? "trusted" : "untrusted",
        })
    }

    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
            "RateLimit-Limit": String(result.limit),
            "RateLimit-Remaining": String(result.remaining),
            "RateLimit-Reset": String(result.resetSeconds),
            "Retry-After": String(result.resetSeconds),
        },
    })
}
