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

const { act, cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react")
const { LicenseDataProvider, useLicenseData } = await import("../../src/components/licenses/LicenseDataProvider")
const originalFetch = globalThis.fetch
const originalDateNow = Date.now

function LicenseState() {
    const { isLoading } = useLicenseData()
    return <span>{isLoading ? "loading" : "loaded"}</span>
}

function PaginatedLicenseState() {
    const { customers, loadMore, loadingMore, pagination } = useLicenseData()
    return (
        <div>
            <span>{customers.map((customer) => customer.id).join(",")}</span>
            {pagination?.customers?.hasNextPage ? (
                <button type="button" disabled={loadingMore === "customers"} onClick={() => void loadMore("customers")}>
                    More
                </button>
            ) : null}
        </div>
    )
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    Date.now = originalDateNow
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

test("refreshes on focus only after the dashboard data is stale", async () => {
    let now = 1_000_000
    Date.now = () => now
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ customers: [], licenses: [] }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." redirectUrl="https://app.example/login">
            <LicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("loaded"))
    assert.equal(requests.length, 1)

    now += 5 * 60_000 - 1
    await act(() => window.dispatchEvent(new Event("focus")))
    assert.equal(requests.length, 1)

    now += 1
    await act(() => window.dispatchEvent(new Event("focus")))
    await waitFor(() => assert.equal(requests.length, 2))

    await act(() => window.dispatchEvent(new Event("focus")))
    await new Promise((resolve) => setTimeout(resolve, 10))
    assert.equal(requests.length, 2)
})

test("loads and merges the next customer cursor page", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        const secondPage = requests.length > 1
        return new Response(
            JSON.stringify({
                customers: [{ id: `gid://crater/Customer/${secondPage ? 2 : 1}`, licenseCount: 0 }],
                licenses: [],
                pagination: { customers: { endCursor: secondPage ? null : "customer-page-1", hasNextPage: !secondPage } },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." redirectUrl="https://app.example/login">
            <PaginatedLicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("gid://crater/Customer/1"))
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    assert.ok(await screen.findByText("gid://crater/Customer/1,gid://crater/Customer/2"))
    assert.equal(requests[1], "https://code0.example/api/crater/licenses?customerAfter=customer-page-1")
    assert.equal(screen.queryByRole("button", { name: "More" }), null)
})
