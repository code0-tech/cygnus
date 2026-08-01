import assert from "node:assert/strict"
import test, { mock } from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { createGraphQLTestServer } from "./graphqlTestServer"

const subscriptionConfig = {
    aiTokens: {
        b2b: { min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { min: 10_000, max: 100_000, step: 10_000 },
    },
    defaults: {
        aiTokens: { b2b: 200_000, b2c: 20_000 },
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
        workflowExecutions: { b2b: 1_000, b2c: 100 },
    },
    workflowExecutions: {
        b2b: { min: 200, max: 10_000, step: 100 },
        b2c: { min: 10, max: 1_000, step: 10 },
    },
} as SubscriptionConfigData

mock.module("@/lib/cms", {
    namedExports: {
        getSubscriptionConfig: async () => subscriptionConfig,
    },
})

const { POST } = await import("../../src/app/api/crater/checkout/session/route")

test("checkout rejects requests without a Crater session", async () => {
    const response = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            body: JSON.stringify({ plan: "pro", deploymentType: "self_hosted" }),
        })
    )

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), {
        error: "Crater session authorization is required.",
    })
})

test("checkout rejects authorization schemes other than Session", async () => {
    const response = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers: {
                authorization: "Bearer c_ust_example",
                "content-type": "application/json",
            },
            body: JSON.stringify({ plan: "pro", deploymentType: "self_hosted" }),
        })
    )

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), {
        error: "Crater session authorization is invalid.",
    })
})

test("checkout requires a deployment type for regular plans", async () => {
    const response = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers: {
                authorization: "Session c_ust_example",
                "content-type": "application/json",
            },
            body: JSON.stringify({ plan: "pro" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "deploymentType must be cloud or self_hosted for a regular checkout.",
    })
})

test("checkout rejects malformed custom checkout configuration ids", async () => {
    const response = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers: {
                authorization: "Session c_ust_example",
                "content-type": "application/json",
            },
            body: JSON.stringify({ customCheckoutConfigurationId: "123" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "customCheckoutConfigurationId must be a valid Crater global ID.",
    })
})

test("checkout requires exactly one regular plan or custom checkout configuration", async () => {
    const headers = {
        authorization: "Session c_ust_example",
        "content-type": "application/json",
    }
    const missingResponse = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers,
            body: JSON.stringify({ deploymentType: "self_hosted" }),
        })
    )
    const combinedResponse = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers,
            body: JSON.stringify({
                plan: "pro",
                customCheckoutConfigurationId: "gid://crater/CustomCheckoutConfiguration/4",
                deploymentType: "self_hosted",
            }),
        })
    )

    assert.equal(missingResponse.status, 400)
    assert.equal(combinedResponse.status, 400)
    assert.deepEqual(await missingResponse.json(), {
        error: "Provide either plan or customCheckoutConfigurationId.",
    })
    assert.deepEqual(await combinedResponse.json(), {
        error: "Provide either plan or customCheckoutConfigurationId.",
    })
})

test("forces the custom plan for b2b customers requesting pro or max, even sent directly to the API", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        expiresAt: 1_800_000_000,
                        id: "cs_b2b_downgrade",
                        url: "https://checkout.stripe.com/b2b-downgrade",
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    process.env.NEXT_PUBLIC_APP_URL = "https://code0.example"

    try {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    authorization: "Session b2b-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    plan: "pro",
                    customerType: "b2b",
                    deploymentType: "self_hosted",
                    paymentPeriod: "monthly",
                }),
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                cancelUrl: "https://code0.example/checkout",
                deploymentType: "self_hosted",
                plan: "custom",
                successUrl: "https://code0.example/checkout/success",
            },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
        else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
        await graphQLServer.close()
    }
})

test("creates regular and custom checkout sessions with the expected Crater inputs", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        expiresAt: 1_800_000_000,
                        id: "cs_regular",
                        url: "https://checkout.stripe.com/regular",
                    },
                },
            },
        },
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        expiresAt: 1_800_000_001,
                        id: "cs_custom",
                        url: "https://checkout.stripe.com/custom",
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    process.env.NEXT_PUBLIC_APP_URL = "https://code0.example"

    try {
        const regularResponse = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    authorization: "Session regular-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    plan: "pro",
                    deploymentType: "self_hosted",
                    paymentPeriod: "monthly",
                    promotionCode: "SAVE10",
                }),
            })
        )
        const customResponse = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    authorization: "Session custom-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    customCheckoutConfigurationId: "gid://crater/CustomCheckoutConfiguration/4",
                }),
            })
        )

        assert.equal(regularResponse.status, 200)
        assert.deepEqual(await regularResponse.json(), {
            expiresAt: 1_800_000_000,
            id: "cs_regular",
            url: "https://checkout.stripe.com/regular",
        })
        assert.equal(customResponse.status, 200)

        assert.equal(graphQLServer.requests[0].authorization, "Session regular-token")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                cancelUrl: "https://code0.example/checkout",
                deploymentType: "self_hosted",
                plan: "pro",
                promotionCode: "SAVE10",
                successUrl: "https://code0.example/checkout/success",
            },
        })
        assert.equal(graphQLServer.requests[1].authorization, "Session custom-token")
        assert.deepEqual(graphQLServer.requests[1].body.variables, {
            input: {
                cancelUrl: "https://code0.example/checkout",
                customCheckoutConfigurationId: "gid://crater/CustomCheckoutConfiguration/4",
                successUrl: "https://code0.example/checkout/success",
            },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
        else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
        await graphQLServer.close()
    }
})
