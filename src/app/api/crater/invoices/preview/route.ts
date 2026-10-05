import { craterJson, requireCraterSession } from "@/lib/crater/api.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_INVOICE_PDF_BYTES = 25 * 1024 * 1024

function parseStripeInvoicePdfUrl(value: string | null) {
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

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const invoiceUrl = parseStripeInvoicePdfUrl(new URL(request.url).searchParams.get("url"))
    if (!invoiceUrl) return craterJson({ error: "A valid Stripe invoice PDF URL is required." }, 400)

    try {
        const response = await fetch(invoiceUrl, { cache: "no-store", redirect: "follow" })
        if (!response.ok || !response.body) return craterJson({ error: "Could not load the invoice PDF." }, 502)

        const contentLength = Number(response.headers.get("content-length"))
        if (Number.isFinite(contentLength) && contentLength > MAX_INVOICE_PDF_BYTES) {
            return craterJson({ error: "The invoice PDF is too large." }, 502)
        }

        const pdf = new Uint8Array(await response.arrayBuffer())
        const hasPdfSignature = pdf.length >= 5 && pdf[0] === 0x25 && pdf[1] === 0x50 && pdf[2] === 0x44 && pdf[3] === 0x46 && pdf[4] === 0x2d
        if (!hasPdfSignature || pdf.length > MAX_INVOICE_PDF_BYTES) return craterJson({ error: "Stripe returned an invalid invoice PDF." }, 502)

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
