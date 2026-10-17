import assert from "node:assert/strict"
import test, { type TestContext } from "node:test"
import { GET as previewInvoice } from "../../src/app/api/crater/invoices/preview/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const CUSTOMER_ID = "gid://crater/Customer/7"
const SUBSCRIPTION_ID = "gid://crater/Subscription/11"
const INVOICE_ID = "gid://crater/Invoice/23"
const invoiceUrl = "https://pay.stripe.com/invoice/acct_123/invst_123/pdf?s=secret"
const sessionHeaders = { authorization: "Session c_ust_example" }
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])

function previewRequest(params: Record<string, string> = { customerId: CUSTOMER_ID, subscriptionId: SUBSCRIPTION_ID, invoiceId: INVOICE_ID }, headers: Record<string, string> = sessionHeaders) {
    return new Request(`https://example.com/api/crater/invoices/preview?${new URLSearchParams(params)}`, { headers })
}

const customerPage = {
    data: { currentUser: { customers: { edges: [{ cursor: "customer-1", node: { id: CUSTOMER_ID } }], pageInfo: { endCursor: "customer-1", hasNextPage: false } } } },
}
const subscriptionPage = {
    data: {
        currentUser: {
            customers: {
                nodes: [{ id: CUSTOMER_ID, subscriptions: { edges: [{ cursor: "subscription-1", node: { id: SUBSCRIPTION_ID } }], pageInfo: { endCursor: "subscription-1", hasNextPage: false } } }],
            },
        },
    },
}
function invoicePage(invoices: Array<{ id: string; stripePdfUrl: string | null }>) {
    return {
        data: {
            currentUser: {
                customers: {
                    nodes: [
                        {
                            id: CUSTOMER_ID,
                            subscriptions: { nodes: [{ id: SUBSCRIPTION_ID, currentLicense: { invoices: { nodes: invoices, pageInfo: { endCursor: null, hasNextPage: false } } } }] },
                        },
                    ],
                },
            },
        },
    }
}

function mockStripe(context: TestContext, stripe: (url: URL) => Response) {
    const originalFetch = globalThis.fetch
    const requested: string[] = []
    context.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : String(input))
        if (!url.hostname.endsWith("stripe.com")) return originalFetch(input, init)
        requested.push(url.toString())
        assert.equal(init?.redirect, "manual")
        return stripe(url)
    })
    return requested
}

test("invoice preview requires a Crater session", async () => {
    const response = await previewInvoice(previewRequest(undefined, {}))

    assert.equal(response.status, 403)
})

test("invoice preview requires Crater customer, subscription, and invoice ids instead of a URL", async () => {
    for (const params of [
        { url: invoiceUrl } as Record<string, string>,
        { customerId: CUSTOMER_ID, subscriptionId: SUBSCRIPTION_ID, invoiceId: "23" },
        { customerId: CUSTOMER_ID, invoiceId: INVOICE_ID },
    ]) {
        const response = await previewInvoice(previewRequest(params))

        assert.equal(response.status, 400)
        assert.deepEqual(await response.json(), { error: "A valid Crater customer, subscription, and invoice id are required." })
    }
})

test("invoice preview loads the PDF URL Crater returns for the session's own invoice", async (context) => {
    const requested = mockStripe(context, () => new Response(pdf, { headers: { "content-type": "application/octet-stream" } }))

    await withGraphQLServer(
        [
            customerPage,
            subscriptionPage,
            invoicePage([
                { id: "gid://crater/Invoice/22", stripePdfUrl: null },
                { id: INVOICE_ID, stripePdfUrl: invoiceUrl },
            ]),
        ],
        async (graphQLServer) => {
            const response = await previewInvoice(previewRequest())

            assert.equal(response.status, 200)
            assert.deepEqual(requested, [invoiceUrl])
            assert.equal(response.headers.get("content-type"), "application/pdf")
            assert.equal(response.headers.get("content-disposition"), "inline")
            assert.match(response.headers.get("cache-control") ?? "", /no-store/)
            assert.deepEqual(new Uint8Array(await response.arrayBuffer()), pdf)

            assert.deepEqual(
                graphQLServer.requests.map((request) => [request.body.operationName, request.authorization]),
                [
                    ["LicenseSnapshotCustomer", "Session c_ust_example"],
                    ["InvoiceSubscriptionPosition", "Session c_ust_example"],
                    ["InvoicePdfUrl", "Session c_ust_example"],
                ]
            )
        }
    )
})

test("invoice preview refuses an invoice that the session cannot reach", async (context) => {
    const requested = mockStripe(context, () => new Response(pdf))

    await withGraphQLServer([customerPage, subscriptionPage, invoicePage([{ id: "gid://crater/Invoice/22", stripePdfUrl: invoiceUrl }])], async () => {
        const response = await previewInvoice(previewRequest())

        assert.equal(response.status, 404)
        assert.deepEqual(requested, [])
    })
})

test("invoice preview refuses a customer outside the session", async (context) => {
    const requested = mockStripe(context, () => new Response(pdf))
    const otherCustomerPage = {
        data: { currentUser: { customers: { edges: [{ cursor: "customer-1", node: { id: "gid://crater/Customer/8" } }], pageInfo: { endCursor: "customer-1", hasNextPage: false } } } },
    }

    await withGraphQLServer([otherCustomerPage], async (graphQLServer) => {
        const response = await previewInvoice(previewRequest())

        assert.equal(response.status, 404)
        assert.equal(graphQLServer.requests.length, 1)
        assert.deepEqual(requested, [])
    })
})

test("invoice preview does not fetch a PDF URL outside Stripe's invoice host", async (context) => {
    const requested = mockStripe(context, () => new Response(pdf))

    await withGraphQLServer([customerPage, subscriptionPage, invoicePage([{ id: INVOICE_ID, stripePdfUrl: "https://example.com/invoice/1/pdf" }])], async () => {
        const originalError = console.error
        console.error = () => {}
        try {
            const response = await previewInvoice(previewRequest())
            assert.equal(response.status, 502)
        } finally {
            console.error = originalError
        }
        assert.deepEqual(requested, [])
    })
})

test("invoice preview follows redirects only within stripe.com", async (context) => {
    const requested = mockStripe(context, (url) => {
        if (url.hostname === "pay.stripe.com") return new Response(null, { status: 302, headers: { location: "https://files.stripe.com/links/invoice.pdf" } })
        if (url.hostname === "files.stripe.com") return new Response(null, { status: 302, headers: { location: "https://evil.example/invoice.pdf" } })
        throw new Error(`Unexpected request to ${url}`)
    })

    await withGraphQLServer([customerPage, subscriptionPage, invoicePage([{ id: INVOICE_ID, stripePdfUrl: invoiceUrl }])], async () => {
        const response = await previewInvoice(previewRequest())

        assert.equal(response.status, 502)
        assert.deepEqual(requested, [invoiceUrl, "https://files.stripe.com/links/invoice.pdf"])
    })
})

test("invoice preview stops reading a PDF without content-length once it exceeds the size limit", async (context) => {
    const chunk = new Uint8Array(1024 * 1024)
    let pulledChunks = 0
    mockStripe(
        context,
        () =>
            new Response(
                new ReadableStream<Uint8Array>({
                    pull(controller) {
                        pulledChunks += 1
                        controller.enqueue(chunk)
                    },
                })
            )
    )

    await withGraphQLServer([customerPage, subscriptionPage, invoicePage([{ id: INVOICE_ID, stripePdfUrl: invoiceUrl }])], async () => {
        const response = await previewInvoice(previewRequest())

        assert.equal(response.status, 502)
        assert.deepEqual(await response.json(), { error: "The invoice PDF is too large." })
        assert.ok(pulledChunks <= 30, `read ${pulledChunks} MiB of an endless body`)
    })
})
