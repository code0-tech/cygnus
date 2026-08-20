import { createRateLimitKey } from "@/lib/security/rateLimitKey"
import { getRateLimitPolicy, type RateLimitPolicy, type RateLimitPolicyName } from "@/lib/security/rateLimitPolicies"

interface RateLimitBucket {
    count: number
    resetAt: number
}

export interface RateLimitResult {
    allowed: boolean
    limit: number
    remaining: number
    resetSeconds: number
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
            this.buckets.set(key, { count: 1, resetAt: now + policy.windowSeconds * 1000 })
            return { allowed: true, limit: policy.max, remaining: policy.max - 1, resetSeconds: policy.windowSeconds }
        }

        const resetSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
        if (current.count >= policy.max) return { allowed: false, limit: policy.max, remaining: 0, resetSeconds }

        current.count += 1
        return { allowed: true, limit: policy.max, remaining: policy.max - current.count, resetSeconds }
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

export function enforceRateLimit(name: RateLimitPolicyName, request: Request) {
    const key = createRateLimitKey(name, request)

    // Without a trusted address or an authenticated session, a shared "unknown" bucket would let one
    // request source deny service to every anonymous user. The deployment should surface a trusted IP.
    if (key === `${name}:anonymous:network:unknown`) return null

    const result = limiter.consume(key, getRateLimitPolicy(name))
    if (result.allowed) return null

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
