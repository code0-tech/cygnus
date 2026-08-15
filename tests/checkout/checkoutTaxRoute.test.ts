import assert from "node:assert/strict"
import test, { mock } from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { createGraphQLTestServer } from "./graphqlTestServer"

const subscriptionConfig = {
    aiTokens: {
        b2b: { default: 200_000, min: 100_000, max: 10_000_000, step: 100_000 },
        b2c: { default: 20_000, min: 10_000, max: 1_000_000, step: 10_000 },
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

const { POST } = await import("../../src/app/api/crater/checkout/tax/route")

test("maps standard and custom tax selections to the current Crater inputs", async () => {
    const taxQuote = {
        amountTotal: 1_190,
        currency: "eur",
        taxAmountExclusive: 190,
    }
    const graphQLServer = await createGraphQLTestServer([
        { data: { checkoutCalculateTax: { errors: [], taxQuote } } },
        { data: { checkoutCalculateTax: { errors: [], taxQuote } } },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const headers = {
            authorization: "Session c_ust_example",
            "content-type": "application/json",
        }
        const standardResponse = await POST(
            new Request("https://example.com/api/crater/checkout/tax", {
                method: "POST",
                headers,
                body: JSON.stringify({ plan: "max", customerType: "b2c", paymentPeriod: "yearly" }),
            })
        )
        const customResponse = await POST(
            new Request("https://example.com/api/crater/checkout/tax", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    plan: "custom",
                    customerType: "b2b",
                    paymentPeriod: "quarterly",
                    aiTokens: "10000000",
                    workflowExecutions: "10000",
                }),
            })
        )

        assert.equal(standardResponse.status, 200)
        assert.equal(customResponse.status, 200)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                paymentPeriod: "YEARLY",
                plan: "max",
            },
        })
        assert.deepEqual(graphQLServer.requests[1].body.variables, {
            input: {
                aiTokens: 10_000_000,
                paymentPeriod: "QUARTERLY",
                plan: "custom",
                workflowExecutions: 10_000,
            },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("tax calculation forwards documented Crater domain error details", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCalculateTax: {
                    errors: [
                        {
                            errorCode: "INVALID_TAX_CALCULATION",
                            details: [{ __typename: "MessageError", message: "The tax location is incomplete." }],
                        },
                    ],
                    taxQuote: null,
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await POST(
            new Request("https://example.com/api/crater/checkout/tax", {
                method: "POST",
                headers: {
                    authorization: "Session c_ust_example",
                    "content-type": "application/json",
                },
                body: JSON.stringify({ plan: "max", customerType: "b2c", paymentPeriod: "monthly" }),
            })
        )

        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), {
            error: "Crater could not calculate tax.",
            errorCode: "INVALID_TAX_CALCULATION",
            details: ["The tax location is incomplete."],
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /fragment CraterErrorFields on Error/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})
