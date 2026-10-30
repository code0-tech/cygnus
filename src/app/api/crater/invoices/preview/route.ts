import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/crater/api.server"
import { isCustomerId, isInvoiceId, isSubscriptionId } from "@/lib/crater/request"
import { clearCraterSessionCookie } from "@/lib/crater/session.server"
import { findInvoicePdfUrl } from "@/lib/licenses/snapshotLookup.server"
import { enforceSessionRateLimit } from "@/lib/security/rateLimiter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_INVOICE_PDF_BYTES = 25 * 1024 * 1024
const MAX_INVOICE_PDF_REDIRECTS = 3

function parseStripeInvoicePdfUrl(value: string | null | undefined) {
    if (!value) return null

    try {
        const url = new URL(value)
        if (url.protocol !== "https:" || url.hostname !== "pay.stripe.com") return null
        if (!url.pathname.startsWith("/invoice/") || !url.pathname.endsWith("/pdf")) return null
        return url
    } catch {
        return null
    }
}

function isStripeHost(url: URL) {
    return url.protocol === "https:" && (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"))
}

async function fetchStripePdf(invoiceUrl: URL) {
    let url = invoiceUrl
    for (let redirects = 0; ; redirects += 1) {
        const response = await fetch(url, { cache: "no-store", redirect: "manual" })
        if (response.status < 300 || response.status >= 400) return response

        await response.body?.cancel()
        const location = response.headers.get("location")
        if (!location || redirects >= MAX_INVOICE_PDF_REDIRECTS) return null
        url = new URL(location, url)
        if (!isStripeHost(url)) return null
    }
}

async function readLimitedBody(body: ReadableStream<Uint8Array>, limit: number) {
    const reader = body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        length += value.byteLength
        if (length > limit) {
            await reader.cancel()
            return null
        }
        chunks.push(value)
    }

    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
    }
    return bytes
}

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const rateLimitResponse = enforceSessionRateLimit("invoicePreview", request, session.token)
    if (rateLimitResponse) return rateLimitResponse

    const searchParams = new URL(request.url).searchParams
    const customerId = searchParams.get("customerId") ?? ""
    const subscriptionId = searchParams.get("subscriptionId") ?? ""
    const invoiceId = searchParams.get("invoiceId") ?? ""
    if (!isCustomerId(customerId) || !isSubscriptionId(subscriptionId) || !isInvoiceId(invoiceId)) {
        return craterJson({ error: "A valid Crater customer, subscription, and invoice id are required." }, 400)
    }

    let invoiceUrl: URL | null
    try {
        const lookup = await findInvoicePdfUrl(session.token, customerId, subscriptionId, invoiceId)
        if (lookup.status === "unauthenticated") return clearCraterSessionCookie(craterJson({ error: "The Crater session has no authenticated user." }, 401), request)
        if (lookup.status === "missing") return craterJson({ error: "The invoice PDF was not found." }, 404)
        invoiceUrl = parseStripeInvoicePdfUrl(lookup.stripePdfUrl)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error, request)
        if (transportResponse) return transportResponse
        console.error("Crater invoice PDF lookup error:", error instanceof Error ? error.name : "Unknown error")
        return craterJson({ error: "Could not load the invoice PDF." }, 502)
    }

    if (!invoiceUrl) {
        console.error("Crater returned an invoice PDF URL outside Stripe's invoice host.")
        return craterJson({ error: "Could not load the invoice PDF." }, 502)
    }

    try {
        const response = await fetchStripePdf(invoiceUrl)
        if (!response?.ok || !response.body) {
            await response?.body?.cancel()
            return craterJson({ error: "Could not load the invoice PDF." }, 502)
        }

        const contentLength = Number(response.headers.get("content-length"))
        if (Number.isFinite(contentLength) && contentLength > MAX_INVOICE_PDF_BYTES) {
            await response.body.cancel()
            return craterJson({ error: "The invoice PDF is too large." }, 502)
        }

        const pdf = await readLimitedBody(response.body, MAX_INVOICE_PDF_BYTES)
        if (!pdf) return craterJson({ error: "The invoice PDF is too large." }, 502)

        const hasPdfSignature = pdf.length >= 5 && pdf[0] === 0x25 && pdf[1] === 0x50 && pdf[2] === 0x44 && pdf[3] === 0x46 && pdf[4] === 0x2d
        if (!hasPdfSignature) return craterJson({ error: "Stripe returned an invalid invoice PDF." }, 502)

        return new Response(pdf, {
            status: 200,
            headers: {
                "cache-control": "private, no-store",
                "content-disposition": "inline",
                "content-type": "application/pdf",
                "x-content-type-options": "nosniff",
            },
        })
    } catch {
        return craterJson({ error: "Could not load the invoice PDF." }, 502)
    }
}
