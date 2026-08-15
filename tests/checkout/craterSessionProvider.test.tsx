import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

const { cleanup, render, screen } = await import("@testing-library/react")
const { CraterSessionProvider, useCraterSession } = await import("../../src/components/checkout/CraterSessionProvider")
const originalFetch = globalThis.fetch

function SessionState() {
    const session = useCraterSession()
    return <span>{session.isLoading ? "loading" : session.authenticated ? "authenticated" : session.error}</span>
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    window.history.replaceState({}, "", "/en/checkout")
})

test("restores a Crater session from its HttpOnly cookie after reload", async () => {
    const requests: Array<{ method: string; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: String(input) })
        return new Response(JSON.stringify({ authenticated: true }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    render(
        <CraterSessionProvider>
            <SessionState />
        </CraterSessionProvider>
    )

    assert.ok(await screen.findByText("authenticated"))
    assert.deepEqual(requests, [{ method: "GET", url: "/api/crater/auth/session" }])
})

test("shows a safe error after a failed server-side login callback", async () => {
    window.history.replaceState({}, "", "/en/checkout?plan=pro&authError=session")
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        throw new Error("Unexpected request")
    }) as typeof fetch

    render(
        <CraterSessionProvider errorMessage="Configured session error">
            <SessionState />
        </CraterSessionProvider>
    )

    assert.ok(await screen.findByText("Configured session error"))
    assert.deepEqual(requests, [])
    assert.equal(window.location.pathname, "/en/checkout")
    assert.equal(window.location.search, "?plan=pro")
})

test("shows the configured CMS error instead of the Crater session error", async () => {
    globalThis.fetch = (async (input) => {
        if (String(input) === "/api/crater/auth/session") {
            return new Response(JSON.stringify({ error: "Raw Crater session error" }), { status: 500, headers: { "content-type": "application/json" } })
        }
        throw new Error("Unexpected request")
    }) as typeof fetch

    render(
        <CraterSessionProvider errorMessage="Configured session error">
            <SessionState />
        </CraterSessionProvider>
    )

    assert.ok(await screen.findByText("Configured session error"))
    assert.equal(screen.queryByText("Raw Crater session error"), null)
})
