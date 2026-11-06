import assert from "node:assert/strict"
import test, { afterEach, beforeEach, mock } from "node:test"
import { registerHooks } from "node:module"
import { createElement } from "react"
import { installDomTestEnvironment } from "./helpers/domTestEnvironment"

installDomTestEnvironment()
const loads: { key: string; options: unknown }[] = []
mock.module("@stripe/stripe-js/pure", {
    namedExports: {
        loadStripe: (key: string, options?: unknown) => {
            loads.push({ key, options })
            return Promise.resolve({})
        },
    },
})
mock.module("@/lib/cms", { namedExports: { getCookieBanner: async () => null } })
mock.module("@/components/providers/ConsentManagerClient", { namedExports: { ConsentManagerClient: () => null } })

// Next resolves this marker internally; Node's test runner needs the equivalent server-side stub.
const serverOnlyHook = registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context)
    },
})
const { getClientConfig } = await import("../src/lib/clientConfig.server")
const { default: ConsentManager } = await import("../src/components/providers/ConsentManager")
serverOnlyHook.deregister()
const { StripeProvider, useStripePromise } = await import("../src/components/providers/StripeProvider")
const { cleanup, render } = await import("@testing-library/react")
const originalGa = process.env.GA_MEASUREMENT_ID
const originalStripe = process.env.STRIPE_PUBLIC_KEY
const originalSculptor = process.env.SCULPTOR_URL
const originalSculptorLogin = process.env.SCULPTOR_LOGIN_URL
const sculptorConfig = { sculptorUrl: "https://app.example/", sculptorLoginUrl: "https://app.example/login" }

beforeEach(() => {
    process.env.SCULPTOR_URL = sculptorConfig.sculptorUrl
    process.env.SCULPTOR_LOGIN_URL = sculptorConfig.sculptorLoginUrl
})

afterEach(() => {
    cleanup()
    loads.length = 0
    if (originalGa === undefined) delete process.env.GA_MEASUREMENT_ID
    else process.env.GA_MEASUREMENT_ID = originalGa
    if (originalStripe === undefined) delete process.env.STRIPE_PUBLIC_KEY
    else process.env.STRIPE_PUBLIC_KEY = originalStripe
    if (originalSculptor === undefined) delete process.env.SCULPTOR_URL
    else process.env.SCULPTOR_URL = originalSculptor
    if (originalSculptorLogin === undefined) delete process.env.SCULPTOR_LOGIN_URL
    else process.env.SCULPTOR_LOGIN_URL = originalSculptorLogin
})

test("reads public client configuration from the current server environment on every call", () => {
    process.env.GA_MEASUREMENT_ID = " G-STAGING "
    process.env.STRIPE_PUBLIC_KEY = " pk_test_staging "
    assert.deepEqual(getClientConfig(), { gaMeasurementId: "G-STAGING", stripePublicKey: "pk_test_staging", ...sculptorConfig })

    process.env.GA_MEASUREMENT_ID = "G-PRODUCTION"
    process.env.STRIPE_PUBLIC_KEY = "pk_live_production"
    assert.deepEqual(getClientConfig(), { gaMeasurementId: "G-PRODUCTION", stripePublicKey: "pk_live_production", ...sculptorConfig })
})

test("does not expose a non-publishable Stripe key or blank configuration", () => {
    process.env.GA_MEASUREMENT_ID = " "
    process.env.STRIPE_PUBLIC_KEY = "rk_test_not_a_publishable_key"
    assert.deepEqual(getClientConfig(), { gaMeasurementId: undefined, stripePublicKey: null, ...sculptorConfig })
    delete process.env.GA_MEASUREMENT_ID
    delete process.env.STRIPE_PUBLIC_KEY
    assert.deepEqual(getClientConfig(), { gaMeasurementId: undefined, stripePublicKey: null, ...sculptorConfig })
})

test("passes the runtime Analytics measurement ID from the server into the consent client", async () => {
    process.env.GA_MEASUREMENT_ID = " G-STAGING "
    const staging = await ConsentManager({ children: null, locale: "en" })
    assert.equal(staging.props.gaMeasurementId, "G-STAGING")
    process.env.GA_MEASUREMENT_ID = "G-PRODUCTION"
    const production = await ConsentManager({ children: null, locale: "en" })
    assert.equal(production.props.gaMeasurementId, "G-PRODUCTION")
})

test("initializes Stripe lazily with the server-provided key and reuses each SDK mode", () => {
    const observed: ReturnType<typeof useStripePromise>[] = []
    function Consumer({ mode }: { mode: "checkout" | "paymentMethod" }) {
        observed.push(useStripePromise(mode))
        return null
    }
    const { rerender } = render(createElement(StripeProvider, { publicKey: "pk_test_runtime", children: null }))
    assert.equal(loads.length, 0)
    const children = [
        createElement(Consumer, { key: "billing", mode: "checkout" }),
        createElement(Consumer, { key: "payment", mode: "checkout" }),
        createElement(Consumer, { key: "setup", mode: "paymentMethod" }),
    ]
    rerender(createElement(StripeProvider, { publicKey: "pk_test_runtime", children }))
    assert.deepEqual(loads, [
        { key: "pk_test_runtime", options: { betas: ["custom_checkout_tax_id_1"], locale: "en" } },
        { key: "pk_test_runtime", options: undefined },
    ])
    assert.equal(observed[0], observed[1])
    assert.notEqual(observed[0], observed[2])
    rerender(createElement(StripeProvider, { publicKey: "pk_test_runtime", children: [...children] }))
    assert.equal(loads.length, 2)

    rerender(createElement(StripeProvider, { publicKey: "pk_live_runtime", children: [...children] }))
    assert.equal(loads.length, 4)
    assert.ok(loads.slice(2).every(({ key }) => key === "pk_live_runtime"))
})

test("keeps Stripe unavailable when the server provides no public key", () => {
    let promise: ReturnType<typeof useStripePromise> | undefined
    function Consumer() {
        promise = useStripePromise("checkout")
        return null
    }
    render(createElement(StripeProvider, { publicKey: null, children: createElement(Consumer) }))
    assert.equal(promise, null)
    assert.equal(loads.length, 0)
})
