import assert from "node:assert/strict"
import test from "node:test"
import { POST as createInvoicePaymentSession } from "../../src/app/api/crater/invoices/payment-session/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const invoiceId = "gid://crater/Invoice/7"

function request(body: unknown, token = "c_ust_invoice_payment") {
    return new Request("https://example.com/api/crater/invoices/payment-session", {
        method: "POST",
        headers: { authorization: `Session ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
    })
}

test("returns the client secret Crater hands out for an open invoice", async () => {
    await withGraphQLServer([{ data: { invoicesPaymentSession: { clientSecret: "pi_7_secret_8", errors: [] } } }], async (server) => {
        const response = await createInvoicePaymentSession(request({ invoiceId }))

        assert.equal(response.status, 200)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.deepEqual(await response.json(), { clientSecret: "pi_7_secret_8" })
        assert.equal(server.requests[0].authorization, "Session c_ust_invoice_payment")
        assert.equal(server.requests[0].body.operationName, "InvoicesPaymentSession")
        assert.deepEqual(server.requests[0].body.variables, { input: { invoiceId } })
    })
})

test("forwards INVALID_INVOICE for a paid, closed, or foreign invoice", async () => {
    await withGraphQLServer(
        [{ data: { invoicesPaymentSession: { clientSecret: null, errors: [{ errorCode: "INVALID_INVOICE", details: [{ __typename: "MessageError", message: "The selected invoice is not available" }] }] } } }],
        async () => {
            const response = await createInvoicePaymentSession(request({ invoiceId }, "c_ust_invoice_invalid"))

            assert.equal(response.status, 422)
            assert.equal((await response.json()).errorCode, "INVALID_INVOICE")
        }
    )
})

test("refuses a missing session or a malformed invoice id before calling Crater", async () => {
    await withGraphQLServer([], async (server) => {
        const anonymous = await createInvoicePaymentSession(
            new Request("https://example.com/api/crater/invoices/payment-session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ invoiceId }) })
        )
        assert.equal(anonymous.status, 403)

        for (const body of [{}, { invoiceId: 7 }, { invoiceId: "gid://crater/Subscription/7" }]) {
            const response = await createInvoicePaymentSession(request(body, "c_ust_invoice_malformed"))
            assert.equal(response.status, 400)
            assert.deepEqual(await response.json(), { error: "A valid Crater invoice id is required." })
        }

        assert.equal(server.requests.length, 0)
    })
})

test("treats a success payload without a client secret as a Crater failure", async () => {
    await withGraphQLServer([{ data: { invoicesPaymentSession: { clientSecret: null, errors: [] } } }], async () => {
        const response = await createInvoicePaymentSession(request({ invoiceId }, "c_ust_invoice_empty"))
        assert.equal(response.status, 502)
    })
})
