import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/licenses?token=legacy-secret")

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/licenses",
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const { LicenseDataProvider, useLicenseData } = await import("../../src/components/licenses/LicenseDataProvider")
const originalFetch = globalThis.fetch

function LicenseState() {
    const { isLoading } = useLicenseData()
    return <span>{isLoading ? "loading" : "loaded"}</span>
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    window.history.replaceState({}, "", "/en/licenses?token=legacy-secret")
})

test("loads licenses through the HttpOnly cookie without exposing a session token to JavaScript", async () => {
    const requests: Array<{ credentials?: RequestCredentials; headers?: HeadersInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ credentials: init?.credentials, headers: init?.headers, url: String(input) })
        return new Response(JSON.stringify({ customers: [], licenses: [] }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." redirectUrl="https://app.example/login">
            <LicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("loaded"))
    assert.equal(requests.length, 1)
    assert.equal(requests[0].credentials, "same-origin")
    assert.equal(requests[0].headers, undefined)
    assert.equal(requests[0].url, "https://code0.example/api/crater/licenses")
    assert.equal(window.location.search, "")
})
