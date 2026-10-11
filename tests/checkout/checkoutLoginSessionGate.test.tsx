import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment("https://example.com/en/checkout/login?plan=pro")

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const { CheckoutLoginSessionGate } = await import("../../src/components/checkout/login/CheckoutLoginSessionGate")
const originalFetch = globalThis.fetch

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    document.cookie = "crater_user_login=; max-age=0; path=/"
    window.history.replaceState({}, "", "/en/checkout/login?plan=pro")
})

function renderGate(checkSession: boolean) {
    return render(
        <CheckoutLoginSessionGate checkoutHref="/en/checkout?plan=pro" checkSession={checkSession}>
            <span>login choice</span>
        </CheckoutLoginSessionGate>
    )
}

test("sends a returning account customer with a valid session straight to the checkout", async () => {
    document.cookie = "crater_user_login=1; path=/; samesite=lax"
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ authenticated: true }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    renderGate(true)

    await waitFor(() => assert.equal(`${window.location.pathname}${window.location.search}`, "/en/checkout?plan=pro"))
    assert.equal(screen.queryByText("login choice"), null)
    assert.deepEqual(requests, ["/api/crater/auth/session"])
})

test("shows the login choice and drops the marker when the account session has expired", async () => {
    document.cookie = "crater_user_login=1; path=/; samesite=lax"
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch

    renderGate(true)

    assert.ok(await screen.findByText("login choice"))
    assert.doesNotMatch(document.cookie, /crater_user_login/)
    assert.equal(window.location.pathname, "/en/checkout/login")
})

test("keeps the login choice available when the session cannot be checked", async () => {
    document.cookie = "crater_user_login=1; path=/; samesite=lax"
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Could not validate Crater session." }), { status: 502 })) as typeof fetch

    renderGate(true)

    assert.ok(await screen.findByText("login choice"))
    assert.match(document.cookie, /crater_user_login=1/)
})

test("shows the login choice without a session request for visitors who never logged in", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        throw new Error("Unexpected request")
    }) as typeof fetch

    renderGate(false)

    assert.ok(screen.getByText("login choice"))
    assert.deepEqual(requests, [])
})
