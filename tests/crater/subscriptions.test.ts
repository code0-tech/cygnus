import assert from "node:assert/strict"
import test from "node:test"
import { PATCH as updateSubscription } from "../../src/app/api/crater/subscriptions/route"
import { POST as previewSubscriptionUpdate } from "../../src/app/api/crater/subscriptions/preview/route"
import { POST as cancelSubscription } from "../../src/app/api/crater/subscriptions/cancel/route"
import { POST as resumeSubscription } from "../../src/app/api/crater/subscriptions/resume/route"
import { createGraphQLTestServer } from "../helpers/graphqlTestServer"

const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}
const subscriptionId = "gid://crater/Subscription/42"

async function withGraphQLServer(responses: unknown[], run: (graphQLServer: Awaited<ReturnType<typeof createGraphQLTestServer>>) => Promise<void>) {
    const graphQLServer = await createGraphQLTestServer(responses)
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        await run(graphQLServer)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
}

test("subscription update requires a Crater session", async () => {
    const response = await updateSubscription(
        new Request("https://example.com/api/crater/subscriptions", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: subscriptionId, plan: "max" }),
        })
    )

    assert.equal(response.status, 403)
})

test("subscription update requires a valid subscription id", async () => {
    const response = await updateSubscription(
        new Request("https://example.com/api/crater/subscriptions", {
            method: "PATCH",
            headers: sessionHeaders,
            body: JSON.stringify({ plan: "max" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "A valid Crater subscription id is required." })
})

test("subscription update requires at least one changed field", async () => {
    const response = await updateSubscription(
        new Request("https://example.com/api/crater/subscriptions", {
            method: "PATCH",
            headers: sessionHeaders,
            body: JSON.stringify({ id: subscriptionId }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "At least one of plan, paymentPeriod, aiTokens, workflowExecutions, or paymentMethodId is required." })
})

test("subscription update rejects an unknown payment period", async () => {
    const response = await updateSubscription(
        new Request("https://example.com/api/crater/subscriptions", {
            method: "PATCH",
            headers: sessionHeaders,
            body: JSON.stringify({ id: subscriptionId, paymentPeriod: "biannual" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "paymentPeriod must be monthly, quarterly, or yearly." })
})

test("upgrades a subscription to a higher plan", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsUpdate: {
                        errors: [],
                        subscription: {
                            aiTokens: null,
                            cancelAt: null,
                            canceledAt: null,
                            currentPeriodEnd: "2026-09-01T00:00:00Z",
                            id: subscriptionId,
                            paymentPeriod: "MONTHLY",
                            plan: "MAX",
                            status: "ACTIVE",
                            updatedAt: "2026-08-17T10:00:00Z",
                            workflowExecutions: null,
                        },
                    },
                },
            },
        ],
        async (graphQLServer) => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", {
                    method: "PATCH",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, plan: "max" }),
                })
            )

            assert.equal(response.status, 200)
            assert.equal(graphQLServer.requests[0].authorization, "Session c_ust_example")
            assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionsUpdate")
            assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { id: subscriptionId, plan: "MAX" } })
            assert.deepEqual(await response.json(), {
                aiTokens: null,
                cancelAt: null,
                canceledAt: null,
                currentPeriodEnd: "2026-09-01T00:00:00Z",
                id: subscriptionId,
                pendingUpdate: null,
                paymentPeriod: "monthly",
                plan: "max",
                status: "ACTIVE",
                updatedAt: "2026-08-17T10:00:00Z",
                workflowExecutions: null,
            })
        }
    )
})

test("changes the billing period and converts it to Crater's uppercase enum", async () => {
    await withGraphQLServer(
        [{ data: { subscriptionsUpdate: { errors: [], subscription: { id: subscriptionId, paymentPeriod: "QUARTERLY", plan: "PRO", status: "ACTIVE" } } } }],
        async (graphQLServer) => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", {
                    method: "PATCH",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, paymentPeriod: "quarterly" }),
                })
            )

            assert.equal(response.status, 200)
            assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { id: subscriptionId, paymentPeriod: "QUARTERLY" } })
        }
    )
})

test("increases custom plan quantities", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsUpdate: { errors: [], subscription: { aiTokens: 500_000, id: subscriptionId, plan: "CUSTOM", status: "ACTIVE", workflowExecutions: 2_000 } },
                },
            },
        ],
        async (graphQLServer) => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", {
                    method: "PATCH",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, plan: "custom", aiTokens: 500_000, workflowExecutions: 2_000 }),
                })
            )

            assert.equal(response.status, 200)
            assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { id: subscriptionId, plan: "CUSTOM", aiTokens: 500_000, workflowExecutions: 2_000 } })
        }
    )
})

test("forwards a Crater subscription update error as 422", async () => {
    await withGraphQLServer([{ data: { subscriptionsUpdate: { errors: [{ errorCode: "INVALID_CHECKOUT_SELECTION", details: [] }], subscription: null } } }], async () => {
        const response = await updateSubscription(
            new Request("https://example.com/api/crater/subscriptions", {
                method: "PATCH",
                headers: sessionHeaders,
                body: JSON.stringify({ id: subscriptionId, plan: "max" }),
            })
        )

        assert.equal(response.status, 422)
        const body = (await response.json()) as { errorCode: string }
        assert.equal(body.errorCode, "INVALID_CHECKOUT_SELECTION")
    })
})

test("previews a subscription change without applying it", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsPreviewUpdate: {
                        errors: [],
                        preview: {
                            aiTokens: null,
                            currency: "eur",
                            effectiveAt: "2026-08-17T10:00:00Z",
                            immediate: true,
                            paymentPeriod: "MONTHLY",
                            plan: "MAX",
                            prorationAmount: 1_200,
                            total: 3_000,
                            workflowExecutions: null,
                        },
                    },
                },
            },
        ],
        async (graphQLServer) => {
            const response = await previewSubscriptionUpdate(
                new Request("https://example.com/api/crater/subscriptions/preview", {
                    method: "POST",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, plan: "max" }),
                })
            )

            assert.equal(response.status, 200)
            assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionsPreviewUpdate")
            const body = (await response.json()) as { immediate: boolean; paymentPeriod: string; plan: string; total: number }
            assert.equal(body.immediate, true)
            assert.equal(body.total, 3_000)
            assert.equal(body.plan, "max")
            assert.equal(body.paymentPeriod, "monthly")
        }
    )
})

test("preview requires a valid subscription id", async () => {
    const response = await previewSubscriptionUpdate(
        new Request("https://example.com/api/crater/subscriptions/preview", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ id: "not-a-subscription-id", plan: "max" }),
        })
    )

    assert.equal(response.status, 400)
})

test("cancels a subscription at the end of the current period by default", async () => {
    await withGraphQLServer(
        [{ data: { subscriptionsCancel: { errors: [], subscription: { cancelAt: "2026-09-01T00:00:00Z", canceledAt: "2026-08-17T10:00:00Z", id: subscriptionId, status: "ACTIVE" } } } }],
        async (graphQLServer) => {
            const response = await cancelSubscription(
                new Request("https://example.com/api/crater/subscriptions/cancel", {
                    method: "POST",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId }),
                })
            )

            assert.equal(response.status, 200)
            assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { id: subscriptionId } })
            const body = (await response.json()) as { cancelAt: string }
            assert.equal(body.cancelAt, "2026-09-01T00:00:00Z")
        }
    )
})

test("cancels a subscription immediately when requested", async () => {
    await withGraphQLServer(
        [{ data: { subscriptionsCancel: { errors: [], subscription: { cancelAt: "2026-08-17T10:00:00Z", canceledAt: "2026-08-17T10:00:00Z", id: subscriptionId, status: "CANCELED" } } } }],
        async (graphQLServer) => {
            const response = await cancelSubscription(
                new Request("https://example.com/api/crater/subscriptions/cancel", {
                    method: "POST",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, immediately: true }),
                })
            )

            assert.equal(response.status, 200)
            assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { id: subscriptionId, immediately: true } })
        }
    )
})

test("resumes a cancelled subscription", async () => {
    await withGraphQLServer([{ data: { subscriptionsResume: { errors: [], subscription: { cancelAt: null, canceledAt: null, id: subscriptionId, status: "ACTIVE" } } } }], async (graphQLServer) => {
        const response = await resumeSubscription(
            new Request("https://example.com/api/crater/subscriptions/resume", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ id: subscriptionId }),
            })
        )

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionsResume")
        const body = (await response.json()) as { cancelAt: null }
        assert.equal(body.cancelAt, null)
    })
})

test("resume requires a valid subscription id", async () => {
    const response = await resumeSubscription(
        new Request("https://example.com/api/crater/subscriptions/resume", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({}),
        })
    )

    assert.equal(response.status, 400)
})

test("subscription changes reject unknown plans before calling Crater", async () => {
    for (const [handler, method] of [
        [updateSubscription, "PATCH"],
        [previewSubscriptionUpdate, "POST"],
    ] as const) {
        const response = await handler(
            new Request("https://example.com/api/crater/subscriptions", {
                method,
                headers: sessionHeaders,
                body: JSON.stringify({ id: subscriptionId, plan: "enterprise" }),
            })
        )
        assert.equal(response.status, 400)
        assert.deepEqual(await response.json(), { error: "plan must be pro, max, or custom." })
    }
})

test("subscription preview sends the generated plan enum", async () => {
    await withGraphQLServer([{ data: { subscriptionsPreviewUpdate: { errors: [], preview: { plan: "PRO" } } } }], async (server) => {
        await previewSubscriptionUpdate(
            new Request("https://example.com/api/crater/subscriptions/preview", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ id: subscriptionId, plan: "pro" }),
            })
        )
        assert.deepEqual(server.requests[0].body.variables, { input: { id: subscriptionId, plan: "PRO" } })
    })
})

test("returns a scheduled update separately from the active configuration", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsUpdate: {
                        errors: [],
                        subscription: {
                            id: subscriptionId,
                            plan: "MAX",
                            paymentPeriod: "MONTHLY",
                            status: "ACTIVE",
                            pendingUpdate: { plan: "PRO", paymentPeriod: "YEARLY", effectiveAt: "2026-11-01T00:00:00Z", aiTokens: null, workflowExecutions: null },
                        },
                    },
                },
            },
        ],
        async (server) => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", {
                    method: "PATCH",
                    headers: sessionHeaders,
                    body: JSON.stringify({ id: subscriptionId, plan: "pro", paymentPeriod: "yearly" }),
                })
            )
            assert.equal(response.status, 200)
            assert.deepEqual(await response.json(), {
                id: subscriptionId,
                plan: "max",
                paymentPeriod: "monthly",
                status: "ACTIVE",
                pendingUpdate: { plan: "pro", paymentPeriod: "yearly", effectiveAt: "2026-11-01T00:00:00Z" },
            })
            const query = String(server.requests[0].body.query)
            assert.match(query, /pendingUpdate/)
            assert.match(query, /cancelAt/)
            assert.doesNotMatch(query, /expireAt/)
        }
    )
})

test("assigns an existing payment method through the shared subscription update route", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsUpdate: {
                        errors: [],
                        subscription: { id: subscriptionId, paymentMethodId: "pm_new", plan: "PRO", paymentPeriod: "MONTHLY", pendingUpdate: { plan: "MAX", effectiveAt: "2026-11-01T00:00:00Z" } },
                    },
                },
            },
        ],
        async (server) => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ id: subscriptionId, paymentMethodId: " pm_new " }) })
            )
            assert.equal(response.status, 200)
            const result = await response.json()
            assert.equal(result.paymentMethodId, "pm_new")
            assert.equal(result.plan, "pro")
            assert.equal(result.pendingUpdate.plan, "max")
            assert.deepEqual(server.requests[0].body.variables, { input: { id: subscriptionId, paymentMethodId: "pm_new" } })
            assert.match(String(server.requests[0].body.query), /paymentMethodId/)
        }
    )
})

test("rejects empty or invalid payment method ids before contacting Crater", async () => {
    for (const paymentMethodId of [null, "", "  ", 42, {}]) {
        const response = await updateSubscription(
            new Request("https://example.com/api/crater/subscriptions", { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ id: subscriptionId, paymentMethodId }) })
        )
        assert.equal(response.status, 400)
    }
})

test("preserves the domain error when Crater refuses a payment method assignment", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    subscriptionsUpdate: {
                        errors: [{ errorCode: "INVALID_PAYMENT_METHOD", details: [{ __typename: "MessageError", message: "Payment method does not belong to this customer" }] }],
                        subscription: null,
                    },
                },
            },
        ],
        async () => {
            const response = await updateSubscription(
                new Request("https://example.com/api/crater/subscriptions", { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ id: subscriptionId, paymentMethodId: "pm_other" }) })
            )
            assert.equal(response.status, 422)
            assert.equal((await response.json()).errorCode, "INVALID_PAYMENT_METHOD")
        }
    )
})
