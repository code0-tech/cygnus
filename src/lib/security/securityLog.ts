type SecurityEvent =
    | {
          event: "rate_limit_exceeded"
          policy: string
          limit: number
          retryAfterSeconds: number
          scope: "anonymous" | "authenticated"
      }
    | {
          event: "crater_login_failed"
          errorCode: string
      }

export function logSecurityEvent(event: SecurityEvent) {
    console.warn(
        JSON.stringify({
            timestamp: new Date().toISOString(),
            ...event,
        })
    )
}
