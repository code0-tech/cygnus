import assert from "node:assert/strict"
import test from "node:test"
import { GET as previewInvoice } from "../../src/app/api/crater/invoices/preview/route"

const invoiceUrl = "https://pay.stripe.com/invoice/acct_123/invst_123/pdf?s=secret"
const sessionHeaders = { authorization: "Session c_ust_example" }

test("invoice preview requires a Crater session", async () => {
    const response = await previewInvoice(new Request(`https://example.com/api/crater/invoices/preview?url=${encodeURIComponent(invoiceUrl)}`))

    assert.equal(response.status, 403)
})

test("invoice preview only accepts Stripe invoice PDF URLs", async () => {
    const response = await previewInvoice(new Request(`https://example.com/api/crater/invoices/preview?url=${encodeURIComponent("https://example.com/invoice.pdf")}`, { headers: sessionHeaders }))

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "A valid Stripe invoice PDF URL is required." })
})

test("invoice preview returns the Stripe PDF inline from the same origin", async (context) => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    let requestedUrl = ""
    context.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
        requestedUrl = String(input)
        return new Response(pdf, { headers: { "content-type": "application/octet-stream" } })
    })

    const response = await previewInvoice(new Request(`https://example.com/api/crater/invoices/preview?url=${encodeURIComponent(invoiceUrl)}`, { headers: sessionHeaders }))

    assert.equal(response.status, 200)
    assert.equal(requestedUrl, invoiceUrl)
    assert.equal(response.headers.get("content-type"), "application/pdf")
    assert.equal(response.headers.get("content-disposition"), "inline")
    assert.match(response.headers.get("cache-control") ?? "", /no-store/)
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), pdf)
})
