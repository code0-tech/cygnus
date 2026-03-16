const DEFAULT_RATE_LIMIT_MAX = 5
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 10

type RateLimitRecord = {
    count: number
    windowStart: number
}

export function getClientIdentifier(request: Request) {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim()
    return ip || request.headers.get("x-real-ip") || "unknown"
}

export const escapeHtml = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")

export const getRateLimitConfig = (
    maxEnvKey: string,
    windowEnvKey: string,
    defaultMax = DEFAULT_RATE_LIMIT_MAX,
    defaultWindowSeconds = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
) => {
    const maxRaw = process.env[maxEnvKey]
    const windowRaw = process.env[windowEnvKey]

    const max = Number.parseInt(maxRaw ?? String(defaultMax), 10)
    const windowSeconds = Number.parseInt(windowRaw ?? String(defaultWindowSeconds), 10)

    return {
        max: Number.isFinite(max) && max > 0 ? max : defaultMax,
        windowMs: (Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : defaultWindowSeconds) * 1000,
    }
}

export const createRateLimitChecker = (config: { max: number; windowMs: number }) => {
    const attempts = new Map<string, RateLimitRecord>()

    return (clientId: string) => {
        const now = Date.now()
        const current = attempts.get(clientId)

        if (!current || now - current.windowStart > config.windowMs) {
            attempts.set(clientId, { count: 1, windowStart: now })
            return { allowed: true, retryAfterSeconds: 0 }
        }

        if (current.count >= config.max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((config.windowMs - (now - current.windowStart)) / 1000))
            return { allowed: false, retryAfterSeconds }
        }

        attempts.set(clientId, { ...current, count: current.count + 1 })
        return { allowed: true, retryAfterSeconds: 0 }
    }
}
