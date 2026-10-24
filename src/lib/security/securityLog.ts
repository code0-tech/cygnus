type SecurityEvent =
    | {
          event: "rate_limit_exceeded"
          policy: string
          limit: number
          retryAfterSeconds: number
          network: "trusted" | "untrusted"
      }
    | {
          event: "rate_limit_untrusted_network"
          policy: string
      }
    | {
          event: "crater_login_failed" | "crater_guest_user_failed"
          errorCode: string
      }

export function logSecurityEvent(event: SecurityEvent, level: "warn" | "error" = "warn") {
    console[level](
        JSON.stringify({
            timestamp: new Date().toISOString(),
            ...event,
        })
    )
}
