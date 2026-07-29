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

export function readCraterSessionAuthorization(request: Request): CraterSessionAuthorization {
    const authorization = request.headers.get("authorization")

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
