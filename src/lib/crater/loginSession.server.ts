import { revokeCraterSession } from "@/lib/crater/logout.server"
import { readCraterSessionAuthorization, setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import type { NextResponse } from "next/server"

export async function replaceCraterLoginSession(request: Request, response: NextResponse, token: string) {
    const previous = readCraterSessionAuthorization(request)
    if (previous.status === "authenticated" && previous.token !== token) {
        // An expired or already revoked session must not prevent a fresh login.
        // revokeCraterSession logs transport and domain failures without exposing tokens.
        await revokeCraterSession(previous.token)
    }
    return setCraterUserLoginCookie(setCraterSessionCookie(response, token))
}
