import assert from "node:assert/strict"
import test from "node:test"
import { PATCH as updateCustomer, POST as createCustomer } from "../../src/app/api/crater/customer/route"
import { POST as createPaymentMethodSetup } from "../../src/app/api/crater/customer/payment-method-setup/route"
import { GET as previewInvoice } from "../../src/app/api/crater/invoices/preview/route"
import { PATCH as updateSubscription } from "../../src/app/api/crater/subscriptions/route"
import { POST as cancelSubscription } from "../../src/app/api/crater/subscriptions/cancel/route"
import { POST as previewSubscription } from "../../src/app/api/crater/subscriptions/preview/route"
import { POST as resumeSubscription } from "../../src/app/api/crater/subscriptions/resume/route"

type RouteHandler = (request: Request) => Promise<Response>

// Each first request is refused with 400 before Crater is reached, so no GraphQL server is needed.
const limitedRoutes: Array<{ name: string; envPrefix: string; handler: RouteHandler; method: string; path: string }> = [
    { name: "customer creation", envPrefix: "CRATER_CUSTOMER", handler: createCustomer, method: "POST", path: "/api/crater/customer" },
    { name: "customer update", envPrefix: "CRATER_CUSTOMER", handler: updateCustomer, method: "PATCH", path: "/api/crater/customer" },
    { name: "payment method setup", envPrefix: "CRATER_PAYMENT_METHOD_SETUP", handler: createPaymentMethodSetup, method: "POST", path: "/api/crater/customer/payment-method-setup" },
    { name: "subscription update", envPrefix: "CRATER_SUBSCRIPTION", handler: updateSubscription, method: "PATCH", path: "/api/crater/subscriptions" },
    { name: "subscription cancellation", envPrefix: "CRATER_SUBSCRIPTION", handler: cancelSubscription, method: "POST", path: "/api/crater/subscriptions/cancel" },
    { name: "subscription resumption", envPrefix: "CRATER_SUBSCRIPTION", handler: resumeSubscription, method: "POST", path: "/api/crater/subscriptions/resume" },
    { name: "subscription preview", envPrefix: "CRATER_SUBSCRIPTION_PREVIEW", handler: previewSubscription, method: "POST", path: "/api/crater/subscriptions/preview" },
    { name: "invoice preview", envPrefix: "CRATER_INVOICE_PREVIEW", handler: previewInvoice, method: "GET", path: "/api/crater/invoices/preview" },
]

function withRateLimitEnvironment(envPrefix: string, run: () => Promise<void>) {
    const values: Record<string, string> = {
        [`${envPrefix}_RATE_LIMIT_MAX`]: "1",
        [`${envPrefix}_RATE_LIMIT_WINDOW_SECONDS`]: "90",
        CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1",
    }
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]))
    Object.assign(process.env, values)
    const originalWarn = console.warn
    console.warn = () => {}

    return run().finally(() => {
        console.warn = originalWarn
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })
}

let addressCounter = 0
function nextAddress() {
    addressCounter += 1
    return `198.51.100.${addressCounter}`
}

function routeRequest(route: (typeof limitedRoutes)[number], { address, sessionToken }: { address: string; sessionToken?: string }) {
    return new Request(`https://example.com${route.path}`, {
        method: route.method,
        headers: {
            ...(sessionToken ? { authorization: `Session ${sessionToken}` } : {}),
            "content-type": "application/json",
            "x-forwarded-for": address,
        },
        ...(route.method === "GET" ? {} : { body: JSON.stringify({}) }),
    })
}

for (const route of limitedRoutes) {
    test(`${route.name} is limited per address and per session`, async () => {
        await withRateLimitEnvironment(route.envPrefix, async () => {
            const sessionToken = `route-limit-${route.name.replaceAll(" ", "-")}`
            const address = nextAddress()

            // A request without a session is refused before it can consume the budget.
            assert.equal((await route.handler(routeRequest(route, { address }))).status, 403)

            assert.equal((await route.handler(routeRequest(route, { address, sessionToken }))).status, 400)

            const sameAddress = await route.handler(routeRequest(route, { address, sessionToken: `${sessionToken}-other` }))
            assert.equal(sameAddress.status, 429)
            assert.equal(sameAddress.headers.get("retry-after"), "90")

            // A new address does not reset the budget of a session that already used it.
            assert.equal((await route.handler(routeRequest(route, { address: nextAddress(), sessionToken }))).status, 429)

            assert.equal((await route.handler(routeRequest(route, { address: nextAddress(), sessionToken: `${sessionToken}-fresh` }))).status, 400)
        })
    })
}
