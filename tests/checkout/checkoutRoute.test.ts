import assert from "node:assert/strict"
import test, { mock } from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { createGraphQLTestServer } from "./graphqlTestServer"

const subscriptionConfig = {
    aiTokens: {
        b2b: { default: 200_000, min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { default: 20_000, min: 10_000, max: 100_000, step: 10_000 },
    },
    defaults: {
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
    },
    workflowExecutions: {
        b2b: { default: 1_000, min: 200, max: 10_000, step: 100 },
        b2c: { default: 100, min: 10, max: 1_000, step: 10 },
    },
} as SubscriptionConfigData

mock.module("@/lib/cms", {
    namedExports: {
        getSubscriptionConfig: async () => subscriptionConfig,
    },
})

mock.method(Date, "now", () => 1_800_000_000_000)

const { POST } = await import("../../src/app/api/crater/checkout/session/route")

test("forwards custom quantities unchanged for backend limits and supports the customer's default checkout", async () => {
    const graphQLServer = await createGraphQLTestServer([{ data: { checkoutCreateSession: { errors: [], session: { clientSecret: "cs_limits", id: "cs_limits" } } } }])
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    try {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: { authorization: "Session limits-test", "content-type": "application/json" },
                body: JSON.stringify({ plan: "custom", deploymentType: "cloud", namespaceId: "opaque-namespace", aiTokens: 5_000_001 }),
            })
        )
        assert.equal(response.status, 200)
        const { input } = graphQLServer.requests[0].body.variables as { input: Record<string, unknown> }
        assert.equal(input.aiTokens, 5_000_001)
        assert.equal(input.plan, "CUSTOM")
        assert.equal(input.deploymentType, "CLOUD")
        assert.equal(input.namespaceId, "opaque-namespace")
        assert.equal("workflowExecutions" in input, false)
        assert.equal("customerId" in input, false)
    } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await graphQLServer.close()
    }
})

test("rejects invalid custom GraphQL quantities and oversized namespace identifiers", async () => {
    for (const extra of [{ aiTokens: 0 }, { aiTokens: -1 }, { aiTokens: 1.5 }, { aiTokens: 2_147_483_648 }, { aiTokens: {} }, { aiTokens: 1, namespaceId: "ü".repeat(251) }]) {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: { authorization: "Session invalid-limits-test", "content-type": "application/json" },
                body: JSON.stringify({ plan: "custom", deploymentType: "cloud", ...extra }),
            })
        )
        assert.equal(response.status, 400)
    }
})

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
        error: "deploymentType must be cloud or self_hosted for checkout.",
    })
})

test("checkout rejects unsupported return locales", async () => {
    const response = await POST(
        new Request("https://example.com/api/crater/checkout/session", {
            method: "POST",
            headers: {
                authorization: "Session c_ust_example",
                "content-type": "application/json",
            },
            body: JSON.stringify({ deploymentType: "self_hosted", locale: "fr", plan: "pro" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "locale must be a supported locale.",
    })
})

test("checkout rejects legacy configuration-only requests", async () => {
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
        error: "plan is required.",
    })
})

test("checkout requires a plan and rejects retired configuration ids", async () => {
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
        error: "plan is required.",
    })
    assert.deepEqual(await combinedResponse.json(), {
        error: "customCheckoutConfigurationId is no longer supported.",
    })
})

test("checkout forwards documented Crater domain error details", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCreateSession: {
                    errors: [
                        {
                            errorCode: "INVALID_CHECKOUT_SELECTION",
                            details: [
                                { __typename: "ActiveModelError", attribute: "plan", type: "invalid" },
                                { __typename: "MessageError", message: "The selected price is unavailable." },
                            ],
                        },
                    ],
                    session: null,
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
                    authorization: "Session c_ust_example",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    customerId: "gid://crater/Customer/1",
                    customerType: "b2c",
                    deploymentType: "self_hosted",
                    paymentPeriod: "monthly",
                    plan: "pro",
                }),
            })
        )

        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), {
            error: "Crater could not create the checkout session.",
            errorCode: "INVALID_CHECKOUT_SELECTION",
            details: ["plan: invalid", "The selected price is unavailable."],
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /fragment CraterErrorFields on Error/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /\.\.\. on ActiveModelError/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /\.\.\. on MessageError/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
        else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
        await graphQLServer.close()
    }
})

test("accepts quarterly and rejects removed weekly periods even when sent directly to the API", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        clientSecret: "cs_b2b_quarterly_secret_test",
                        expiresAt: 1_800_000_000,
                        id: "cs_b2b_quarterly",
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
                    customerId: "gid://crater/Customer/1",
                    plan: "pro",
                    customerType: "b2b",
                    deploymentType: "self_hosted",
                    paymentPeriod: "quarterly",
                }),
            })
        )
        const removedWeeklyResponse = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    authorization: "Session b2b-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    customerId: "gid://crater/Customer/1",
                    plan: "max",
                    customerType: "b2b",
                    deploymentType: "self_hosted",
                    paymentPeriod: "weekly",
                }),
            })
        )

        assert.equal(response.status, 200)
        assert.equal(removedWeeklyResponse.status, 400)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                customerId: "gid://crater/Customer/1",
                deploymentType: "SELF_HOSTED",
                paymentPeriod: "QUARTERLY",
                plan: "PRO",
                returnUrl: "https://code0.example/en/checkout/success?plan=pro&customerType=b2b&deploymentType=self_hosted&paymentPeriod=quarterly&session_id={CHECKOUT_SESSION_ID}",
            },
        })
        assert.equal(graphQLServer.requests.length, 1)
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
                        clientSecret: "cs_regular_secret_test",
                        expiresAt: 1_800_000_000,
                        id: "cs_regular",
                    },
                },
            },
        },
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        clientSecret: "cs_custom_secret_test",
                        expiresAt: 1_800_000_001,
                        id: "cs_custom",
                    },
                },
            },
        },
        {
            data: {
                checkoutCreateSession: {
                    errors: [],
                    session: {
                        clientSecret: "cs_dynamic_custom_secret_test",
                        expiresAt: 1_800_000_002,
                        id: "cs_dynamic_custom",
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
                    customerId: "gid://crater/Customer/1",
                    plan: "pro",
                    deploymentType: "self_hosted",
                    paymentPeriod: "monthly",
                    promotionCode: "SAVE10",
                    locale: "de",
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
                    customerId: "gid://crater/Customer/2",
                    plan: "max",
                    deploymentType: "cloud",
                }),
            })
        )
        const dynamicCustomResponse = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    authorization: "Session dynamic-custom-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    customerId: "gid://crater/Customer/3",
                    plan: "custom",
                    customerType: "b2c",
                    deploymentType: "cloud",
                    namespace: "gid://sagittarius/Namespace/1",
                    paymentPeriod: "quarterly",
                    aiTokens: "30000",
                    workflowExecutions: "200",
                    additionalFeatures: ["priority-support"],
                    features: ["must-not-reach-crater"],
                }),
            })
        )

        assert.equal(regularResponse.status, 200)
        assert.deepEqual(await regularResponse.json(), {
            clientSecret: "cs_regular_secret_test",
            expiresAt: 1_800_000_000,
            id: "cs_regular",
        })
        assert.equal(customResponse.status, 200)
        assert.equal(dynamicCustomResponse.status, 200)

        assert.equal(graphQLServer.requests[0].authorization, "Session regular-token")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                customerId: "gid://crater/Customer/1",
                deploymentType: "SELF_HOSTED",
                paymentPeriod: "MONTHLY",
                plan: "PRO",
                returnUrl: "https://code0.example/de/checkout/success?plan=pro&customerType=b2c&deploymentType=self_hosted&paymentPeriod=monthly&session_id={CHECKOUT_SESSION_ID}",
            },
        })
        assert.equal(graphQLServer.requests[1].authorization, "Session custom-token")
        assert.deepEqual(graphQLServer.requests[1].body.variables, {
            input: {
                customerId: "gid://crater/Customer/2",
                plan: "MAX",
                deploymentType: "CLOUD",
                paymentPeriod: "MONTHLY",
                returnUrl: "https://code0.example/en/checkout/success?plan=max&customerType=b2c&deploymentType=cloud&paymentPeriod=monthly&session_id={CHECKOUT_SESSION_ID}",
            },
        })
        assert.equal(graphQLServer.requests[2].authorization, "Session dynamic-custom-token")
        assert.deepEqual(graphQLServer.requests[2].body.variables, {
            input: {
                aiTokens: 30_000,
                customerId: "gid://crater/Customer/3",
                deploymentType: "CLOUD",
                namespaceId: "gid://sagittarius/Namespace/1",
                paymentPeriod: "QUARTERLY",
                plan: "CUSTOM",
                returnUrl:
                    "https://code0.example/en/checkout/success?plan=custom&customerType=b2c&deploymentType=cloud&paymentPeriod=quarterly&aiTokens=30000&workflowExecutions=200&session_id={CHECKOUT_SESSION_ID}",
                workflowExecutions: 200,
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
