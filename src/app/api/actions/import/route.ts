import { extractActionModuleInfo } from "@/lib/actionExtraction"
import { getPayloadClient } from "@/lib/payloadClient"
import type { Action } from "@/payload-types"
import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

function getBearerToken(request: Request) {
    const authorization = request.headers.get("authorization")?.trim()
    if (!authorization?.toLowerCase().startsWith("bearer ")) return null

    return authorization.slice("bearer ".length).trim()
}

function verifyJwt(token: string | null, secret: string) {
    if (!token) return false
    const parts = token.split(".")
    if (parts.length !== 3) return false

    const [encodedHeader, encodedPayload, signature] = parts
    try {
        const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: string; typ?: string }
        const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number; nbf?: number }
        if (header.alg !== "HS256" || header.typ !== "JWT") return false
        const expectedSignature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url")
        if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false
        const now = Math.floor(Date.now() / 1000)
        return !(typeof payload.exp === "number" && payload.exp <= now) && !(typeof payload.nbf === "number" && payload.nbf > now)
    } catch {
        return false
    }
}

function createJsonUploadFile(identifier: string, module: unknown) {
    const json = JSON.stringify(module, null, 2)
    return {
        data: Buffer.from(json),
        mimetype: "application/json",
        name: `${identifier}.json`,
        size: Buffer.byteLength(json),
    }
}

export async function POST(request: Request) {
    const expectedToken = process.env.ACTIONS_IMPORT_SECRET?.trim()
    const receivedToken = getBearerToken(request)

    const isValidJwt = verifyJwt(receivedToken, expectedToken ?? "")
    const isDevelopmentSecret = process.env.NODE_ENV === "development" && receivedToken === expectedToken

    if (!expectedToken || (!isValidJwt && !isDevelopmentSecret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const module = await request.json().catch(() => null)
    if (!module) {
        return NextResponse.json({ error: "Missing module JSON." }, { status: 400 })
    }

    const moduleInfo = extractActionModuleInfo(module)
    if (!moduleInfo?.identifier) {
        return NextResponse.json({ error: "Module identifier is required." }, { status: 400 })
    }

    if (!moduleInfo.title) {
        return NextResponse.json({ error: "Module name is required." }, { status: 400 })
    }

    const payload = await getPayloadClient()
    const existingActions = await payload.find({
        collection: "actions",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
            identifier: {
                equals: moduleInfo.identifier,
            },
        },
    })
    const existingAction = existingActions.docs[0] as Action | undefined

    const media = await payload.create({
        collection: "media",
        data: {
            alt: `${moduleInfo.title} module`,
        },
        file: createJsonUploadFile(moduleInfo.identifier, module),
        overrideAccess: true,
    })

    const actionData = {
        identifier: moduleInfo.identifier,
        module: media.id,
    }
    const action = existingAction
        ? await payload.update({
              id: existingAction.id,
              collection: "actions",
              data: actionData,
              overrideAccess: true,
          })
        : await payload.create({
              collection: "actions",
              data: actionData,
              overrideAccess: true,
          })

    return NextResponse.json({
        id: action.id,
        identifier: moduleInfo.identifier,
        mediaId: media.id,
        status: existingAction ? "updated" : "created",
    })
}
