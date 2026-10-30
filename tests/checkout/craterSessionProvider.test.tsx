import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

const { act, cleanup, render, screen, waitFor } = await import("@testing-library/react")
const { CraterSessionProvider, useCraterSession } = await import("../../src/components/checkout/session/CraterSessionProvider")
const originalFetch = globalThis.fetch
const originalConsoleError = console.error
const originalDateNow = Date.now

function SessionState() {
    const session = useCraterSession()
    return <span>{session.isLoading ? "loading" : session.authenticated ? "authenticated" : session.error}</span>
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    console.error = originalConsoleError
    Date.now = originalDateNow
    window.history.replaceState({}, "", "/en/checkout")
})

test("rechecks an inactive tab once and sends an expired account session back to login", async () => {
    let now = originalDateNow()
    Date.now = () => now
    window.history.replaceState({}, "", "/en/checkout?plan=pro")
    let requests = 0
    globalThis.fetch = (async () => Response.json({}, { status: ++requests === 1 ? 200 : 401 })) as typeof fetch
    render(<React.StrictMode><CraterSessionProvider><SessionState /></CraterSessionProvider></React.StrictMode>)
    await screen.findByText("authenticated")
    assert.equal(requests, 1)

    now += 61_000
    act(() => {
        window.dispatchEvent(new Event("focus"))
        document.dispatchEvent(new Event("visibilitychange"))
    })
    await waitFor(() => assert.equal(window.location.pathname, "/en/checkout/login"))
    assert.equal(window.location.search, "?plan=pro")
    assert.equal(requests, 2)
})

test("keeps a valid session after returning and throttles repeated focus events", async () => {
    let now = originalDateNow()
    Date.now = () => now
    let requests = 0
    let finishRecheck: (() => void) | undefined
    globalThis.fetch = (async () => {
        requests += 1
        if (requests === 2) await new Promise<void>((resolve) => { finishRecheck = resolve })
        return Response.json({ authenticated: true })
    }) as typeof fetch
    const view = render(<CraterSessionProvider><SessionState /></CraterSessionProvider>)
    await screen.findByText("authenticated")
    act(() => window.dispatchEvent(new Event("focus")))
    assert.equal(requests, 1)

    now += 61_000
    act(() => {
        window.dispatchEvent(new Event("focus"))
        document.dispatchEvent(new Event("visibilitychange"))
    })
    assert.ok(screen.getByText("loading"))
    assert.equal(requests, 2)
    await act(async () => finishRecheck?.())
    await screen.findByText("authenticated")
    act(() => window.dispatchEvent(new Event("focus")))
    assert.equal(requests, 2)

    view.unmount()
    now += 61_000
    window.dispatchEvent(new Event("focus"))
    document.dispatchEvent(new Event("visibilitychange"))
    assert.equal(requests, 2)
})

test("an expired guest checkout returns to login without using the account session", async () => {
    let now = originalDateNow()
    Date.now = () => now
    window.history.replaceState({}, "", "/en/checkout?plan=pro&guestCheckout=purchase-one")
    let requests = 0
    globalThis.fetch = (async (_input, init) => {
        assert.equal(new Headers(init?.headers).get("x-guest-checkout"), "purchase-one")
        return Response.json({ guestEmail: "guest@example.com" }, { status: ++requests === 1 ? 200 : 401 })
    }) as typeof fetch
    render(<CraterSessionProvider><SessionState /></CraterSessionProvider>)
    await screen.findByText("authenticated")
    now += 61_000
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    await waitFor(() => assert.equal(window.location.pathname, "/en/checkout/login"))
    assert.equal(window.location.search, "?plan=pro")
    assert.equal(requests, 2)
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

test("returns an expired account session to the login choice without creating a shared session", async () => {
    window.history.replaceState({}, "", "/en/checkout?plan=pro")
    document.cookie = "crater_user_login=1; path=/; samesite=lax"
    const requests: Array<{ method: string; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: String(input) })
        return new Response("{}", { status: 401 })
    }) as typeof fetch

    render(
        <CraterSessionProvider>
            <SessionState />
        </CraterSessionProvider>
    )

    await waitFor(() => assert.equal(window.location.pathname, "/en/checkout/login"))
    assert.equal(window.location.search, "?plan=pro")
    assert.doesNotMatch(document.cookie, /crater_user_login/)
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

test("sends a visitor without a Crater session to the login choice instead of posting an empty login", async () => {
    window.history.replaceState({}, "", "/en/checkout?plan=pro&deploymentType=cloud")
    const requests: Array<{ method: string; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: String(input) })
        return new Response(JSON.stringify({ error: "Crater session authorization is required." }), { status: 403, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    render(
        <CraterSessionProvider>
            <SessionState />
        </CraterSessionProvider>
    )

    await waitFor(() => assert.equal(window.location.pathname, "/en/checkout/login"))
    assert.equal(window.location.search, "?plan=pro&deploymentType=cloud")
    assert.deepEqual(requests, [{ method: "GET", url: "/api/crater/auth/session" }])
})

test("sends a visitor without a Crater session or configuration to the subscription configurator", async () => {
    window.history.replaceState({}, "", "/de/checkout/")
    const requests: Array<{ method: string; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: String(input) })
        return new Response("{}", { status: 401 })
    }) as typeof fetch

    render(
        <CraterSessionProvider>
            <SessionState />
        </CraterSessionProvider>
    )

    await waitFor(() => assert.equal(window.location.pathname, "/de/subscription"))
    assert.equal(window.location.search, "")
    assert.deepEqual(requests, [{ method: "GET", url: "/api/crater/auth/session" }])
})

test("appends Crater's validation details to the logged error", async () => {
    const loggedArguments: unknown[][] = []
    console.error = (...args: unknown[]) => {
        loggedArguments.push(args)
    }
    globalThis.fetch = (async (input) => {
        if (String(input) === "/api/crater/auth/session") {
            return new Response(JSON.stringify({ error: "Could not validate Crater session.", errorCode: "INVALID_USER", details: ["sagittarius_id: blank", "user unavailable"] }), {
                status: 502,
                headers: { "content-type": "application/json" },
            })
        }
        throw new Error("Unexpected request")
    }) as typeof fetch

    render(
        <CraterSessionProvider errorMessage="Configured session error">
            <SessionState />
        </CraterSessionProvider>
    )

    assert.ok(await screen.findByText("Configured session error"))
    const loggedError = loggedArguments.at(-1)?.at(-1)
    assert.ok(loggedError instanceof Error)
    assert.equal(loggedError.message, "Could not validate Crater session. (INVALID_USER: sagittarius_id: blank, user unavailable)")
})


test("expired guest receipt never logs in through the account or shared session", async () => {
    window.history.replaceState({}, "", "/en/checkout/success?guestCheckout=expired-purchase")
    const requests: string[] = []
    console.error = () => {}
    globalThis.fetch = (async (input, init) => {
        requests.push(String(input))
        assert.equal(new Headers(init?.headers).get("x-guest-checkout"), "expired-purchase")
        return new Response("{}", { status: 401 })
    }) as typeof fetch
    render(<CraterSessionProvider errorMessage="Guest session expired"><SessionState /></CraterSessionProvider>)
    assert.ok(await screen.findByText("Guest session expired"))
    assert.deepEqual(requests, ["/api/crater/auth/session"])
})


test("restores the guest email from the purchase session after reload", async () => {
    window.history.replaceState({}, "", "/en/checkout?guestCheckout=purchase-one")
    globalThis.fetch = (async () => new Response(JSON.stringify({ authenticated: true, guestEmail: "guest@example.com" }), { status: 200 })) as typeof fetch
    function GuestEmail() {
        const session = useCraterSession()
        return <span>{session.guestEmail}</span>
    }
    render(<CraterSessionProvider><GuestEmail /></CraterSessionProvider>)
    assert.ok(await screen.findByText("guest@example.com"))
})
