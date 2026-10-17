import assert from "node:assert/strict"
import test, { mock } from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const previousServerUrl = process.env.SERVER_URL
test.before(() => {
    process.env.SERVER_URL = "https://code0.example"
})
test.after(() => {
    if (previousServerUrl === undefined) delete process.env.SERVER_URL
    else process.env.SERVER_URL = previousServerUrl
})

const subscriptionConfig = {
    defaults: {
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
    },
} as unknown as SubscriptionConfigData

mock.module("@/lib/cms", {
    namedExports: {
        getGlobal: async (slug: string) => (slug === "subscriptionConfig" ? subscriptionConfig : null),
    },
})

mock.module("@/lib/subscription/checkoutPackages.server", {
    namedExports: {
        getCraterCheckoutPackages: async () => ({
            quantitySteps: {
                b2b: { aiTokens: [10_000_000, 100_000_000, 500_000_000, 1_000_000_000], workflowExecutions: [100_000, 1_000_000, 5_000_000, 10_000_000] },
                b2c: { aiTokens: [1_000_000, 10_000_000, 50_000_000, 100_000_000], workflowExecutions: [10_000, 100_000, 500_000, 1_000_000] },
            },
            planQuantities: {
                pro: { aiTokens: 10_000_000, workflowExecutions: 100_000 },
                max: { aiTokens: 100_000_000, workflowExecutions: 1_000_000 },
            },
        }),
    },
})

mock.method(Date, "now", () => 1_800_000_000_000)

const { POST } = await import("../../src/app/api/crater/checkout/session/route")

test("forwards both custom quantities unchanged so Crater can check them against the customer's packages", async () => {
    await withGraphQLServer([{ data: { checkoutCreateSession: { errors: [], session: { clientSecret: "cs_limits", id: "cs_limits" } } } }], async (graphQLServer) => {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: { authorization: "Session limits-test", "content-type": "application/json" },
                body: JSON.stringify({
                    plan: "custom",
                    customerId: "gid://crater/Customer/1",
                    deploymentType: "cloud",
                    namespaceId: "opaque-namespace",
                    aiTokens: 5_000_001,
                    workflowExecutions: 100_000,
                }),
            })
        )
        assert.equal(response.status, 200)
        const { input } = graphQLServer.requests[0].body.variables as { input: Record<string, unknown> }
        assert.equal(input.aiTokens, 5_000_001)
        assert.equal(input.plan, "CUSTOM")
        assert.equal(input.deploymentType, "CLOUD")
        assert.equal(input.namespaceId, "opaque-namespace")
        assert.equal(input.workflowExecutions, 100_000)
        assert.equal(input.customerId, "gid://crater/Customer/1")
    })
})

test("rejects invalid or missing custom quantities and oversized namespace identifiers", async () => {
    for (const extra of [{ aiTokens: 0 }, { aiTokens: -1 }, { aiTokens: 1.5 }, { aiTokens: 2_147_483_648 }, { aiTokens: {} }, { aiTokens: undefined }, { aiTokens: 1, namespaceId: "ü".repeat(251) }]) {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/session", {
                method: "POST",
                headers: { authorization: "Session invalid-limits-test", "content-type": "application/json" },
                body: JSON.stringify({ plan: "custom", customerId: "gid://crater/Customer/1", deploymentType: "cloud", workflowExecutions: 100_000, ...extra }),
            })
        )
        assert.equal(response.status, 400)
    }
})

test("checkout rejects invalid requests before calling Crater", async () => {
    const session = { authorization: "Session c_ust_example", "content-type": "application/json" }
    const regular = { plan: "pro", deploymentType: "self_hosted" }
    // headers: null sends no authorization at all; omitted headers use the valid session.
    const cases: { name: string; headers?: Record<string, string> | null; body: Record<string, unknown>; status: number; error: string }[] = [
        { name: "no session", headers: null, body: regular, status: 403, error: "Crater session authorization is required." },
        { name: "bearer scheme", headers: { ...session, authorization: "Bearer c_ust_example" }, body: regular, status: 401, error: "Crater session authorization is invalid." },
        ...[undefined, "", "42", "gid://crater/License/1"].map((customerId) => ({
            name: `customer id ${String(customerId)}`,
            body: { ...regular, customerId },
            status: 400,
            error: "customerId is required and must be a valid Crater global ID.",
        })),
        { name: "missing deployment type", body: { plan: "pro" }, status: 400, error: "deploymentType must be cloud or self_hosted for checkout." },
        { name: "unsupported locale", body: { ...regular, locale: "fr" }, status: 400, error: "locale must be a supported locale." },
        { name: "legacy configuration only", body: { customCheckoutConfigurationId: "123" }, status: 400, error: "plan is required." },
        { name: "missing plan", body: { deploymentType: "self_hosted" }, status: 400, error: "plan is required." },
        {
            name: "retired configuration id",
            body: { ...regular, customCheckoutConfigurationId: "gid://crater/CustomCheckoutConfiguration/4" },
            status: 400,
            error: "customCheckoutConfigurationId is no longer supported.",
        },
    ]

    for (const { name, headers, body, status, error } of cases) {
        const response = await POST(new Request("https://example.com/api/crater/checkout/session", { method: "POST", ...(headers === null ? {} : { headers: headers ?? session }), body: JSON.stringify(body) }))
        assert.equal(response.status, status, name)
        assert.deepEqual(await response.json(), { error }, name)
    }
})

test("checkout forwards documented Crater domain error details", async () => {
    await withGraphQLServer([
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
    ], async (graphQLServer) => {
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
    })
})

test("accepts quarterly and rejects removed weekly periods even when sent directly to the API", async () => {
    await withGraphQLServer([
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
    ], async (graphQLServer) => {
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
    })
})

test("creates regular and custom checkout sessions with the expected Crater inputs", async () => {
    await withGraphQLServer([
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
    ], async (graphQLServer) => {
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
    })
})
