import assert from "node:assert/strict"
import test from "node:test"
import { POST } from "../src/app/api/crater/checkout/session/route"

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
