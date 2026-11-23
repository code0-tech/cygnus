import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/licenses?token=legacy-secret")

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/licenses",
    },
})

const { act, cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react")
const { LicenseDataProvider, useLicenseData } = await import("../../src/components/licenses/data/LicenseDataProvider")
const originalFetch = globalThis.fetch
const originalDateNow = Date.now

function LicenseState() {
    const { error, isLoading, isNotFound, isSidebarLoading } = useLicenseData()
    return <span>{error ?? (isNotFound ? "not found" : isLoading ? "loading" : isSidebarLoading ? "sidebar loading" : "loaded")}</span>
}

function RefreshableLicenseState() {
    const { customers, error, notice, reload } = useLicenseData()
    return (
        <div>
            <span>{error ?? customers.map((customer) => customer.id).join(",")}</span>
            <span>{notice ? `notice ${notice.id}: ${notice.message}` : "no notice"}</span>
            <button type="button" onClick={reload}>
                Reload
            </button>
        </div>
    )
}

const craterUnavailable = () =>
    new Response(JSON.stringify({ error: "Could not load license dashboard data from Crater.", errorCode: "PAYMENT_METHOD_UNAVAILABLE" }), { status: 503 })

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
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
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
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
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
                customers: [{ id: `gid://crater/Customer/${secondPage ? 2 : 1}`, subscriptionCount: 0 }],
                licenses: [],
                pagination: { customers: { endCursor: secondPage ? null : "customer-page-1", hasNextPage: !secondPage } },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <PaginatedLicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("gid://crater/Customer/1"))
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    assert.ok(await screen.findByText("gid://crater/Customer/1,gid://crater/Customer/2"))
    assert.equal(requests[1], "https://code0.example/api/crater/licenses?customerAfter=customer-page-1&includeNavigation=false")
    assert.equal(screen.queryByRole("button", { name: "More" }), null)
})

test("an initial load failure is a blocking error that a retry clears", async () => {
    let available = false
    globalThis.fetch = (async () =>
        available ? new Response(JSON.stringify({ customers: [{ id: "customer-1", subscriptionCount: 0 }], licenses: [] }), { status: 200 }) : craterUnavailable()) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <RefreshableLicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("Could not load licenses."))
    assert.ok(screen.getByText("no notice"))
    available = true
    fireEvent.click(screen.getByRole("button", { name: "Reload" }))
    assert.ok(await screen.findByText("customer-1"))
})

test("a failed refresh keeps the loaded data and reports a notice per failure", async () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return requests === 1 ? new Response(JSON.stringify({ customers: [{ id: "customer-1", subscriptionCount: 0 }], licenses: [] }), { status: 200 }) : craterUnavailable()
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <RefreshableLicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("customer-1"))
    fireEvent.click(screen.getByRole("button", { name: "Reload" }))
    assert.ok(await screen.findByText("notice 1: Could not load licenses."))
    assert.ok(screen.getByText("customer-1"))
    fireEvent.click(screen.getByRole("button", { name: "Reload" }))
    assert.ok(await screen.findByText("notice 2: Could not load licenses."))
    assert.ok(screen.getByText("customer-1"))
})

test("an unknown customer or license is reported as not found instead of a load error", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: "The requested license was not found." }), { status: 404 })) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <LicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("not found"))
})

function UpdatedSubscriptionState() {
    const { licenses, sidebarLicenses, updateLicense } = useLicenseData()
    const license = licenses[0]
    return <div>
        <output>{JSON.stringify({ license, sidebar: sidebarLicenses[0] })}</output>
        <button onClick={() => updateLicense("subscription-1", { pendingUpdate: { plan: "pro", effectiveAt: "2026-11-01T00:00:00Z" } })}>Schedule</button>
        <button onClick={() => updateLicense("subscription-1", { pendingUpdate: null, cancelAt: "2026-11-01T00:00:00Z", subscriptionStatus: "ACTIVE" })}>Cancel</button>
        <button onClick={() => updateLicense("subscription-1", { cancelAt: null, canceledAt: null, subscriptionStatus: "PAST_DUE" })}>Resume</button>
    </div>
}

test("updates scheduled changes, cancellation dates and subscription status in detail and sidebar", async () => {
    const license = { id: "subscription-1", licenseId: "snapshot-1", customerId: "customer-1", customerName: "Customer", name: "Max", plan: "max", status: "ACTIVE", invoices: [] }
    globalThis.fetch = (async () => new Response(JSON.stringify({ customers: [], licenses: [license], navigationLicenses: [license] }), { status: 200 })) as typeof fetch
    render(<LicenseDataProvider loadError="Error" sessionError="Session unavailable"><UpdatedSubscriptionState /></LicenseDataProvider>)
    await waitFor(() => assert.match(screen.getByRole("status").textContent ?? "", /snapshot-1/))
    const state = () => JSON.parse(screen.getByRole("status").textContent!)
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }))
    assert.equal(state().license.plan, "max")
    assert.equal(state().license.pendingUpdate.plan, "pro")
    assert.deepEqual(state().license, state().sidebar)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    assert.equal(state().license.pendingUpdate, null)
    assert.equal(state().license.cancelAt, "2026-11-01T00:00:00Z")
    fireEvent.click(screen.getByRole("button", { name: "Resume" }))
    assert.equal(state().license.cancelAt, undefined)
    assert.equal(state().license.status, "PAST_DUE")
    assert.deepEqual(state().license, state().sidebar)
})


test("starts the Sculptor login instead of showing an empty dashboard without a session", async () => {
    window.history.replaceState({}, "", "/en/licenses/customer/3/license/9")
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Crater session authorization is required." }), { status: 403 })) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <LicenseState />
        </LicenseDataProvider>
    )

    await waitFor(() => assert.equal(window.location.pathname, "/api/crater/auth/start"))
    assert.equal(new URLSearchParams(window.location.search).get("flow"), "licenses")
    assert.equal(new URLSearchParams(window.location.search).get("returnPath"), "/en/licenses/customer/3/license/9")
    assert.ok(screen.getByText("loading"))
})

test("shows the session error instead of restarting a login that just failed", async () => {
    window.history.replaceState({}, "", "/en/licenses?authError=session")
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response("{}", { status: 403 })
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <LicenseState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("Session unavailable"))
    assert.equal(window.location.pathname, "/en/licenses")
    assert.equal(window.location.search, "")
    assert.equal(requests.length, 1)
})

function AwaitedInvoiceState() {
    const { awaitPayment, awaitingPayment, licenses } = useLicenseData()
    return (
        <div>
            <span>{licenses[0]?.invoices?.[0]?.status ?? "none"}</span>
            <span>{awaitingPayment ? "awaiting" : "idle"}</span>
            <button type="button" onClick={() => awaitPayment({ licenseId: "gid://crater/Subscription/1", invoiceId: "gid://crater/Invoice/7" })}>
                Paid
            </button>
        </div>
    )
}

test("keeps reloading after a confirmed payment until the invoice shows up as paid", async () => {
    const statuses = ["OPEN", "OPEN", "PAID"]
    let requests = 0
    globalThis.fetch = (async () => {
        const status = statuses[Math.min(requests, statuses.length - 1)]
        requests += 1
        const licenses = [{ id: "gid://crater/Subscription/1", customerId: "gid://crater/Customer/1", invoices: [{ id: "gid://crater/Invoice/7", status }] }]
        return new Response(JSON.stringify({ customers: [], licenses }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    render(
        <LicenseDataProvider loadError="Could not load licenses." sessionError="Session unavailable">
            <AwaitedInvoiceState />
        </LicenseDataProvider>
    )

    assert.ok(await screen.findByText("OPEN"))
    fireEvent.click(screen.getByRole("button", { name: "Paid" }))
    assert.ok(await screen.findByText("awaiting"))
    await waitFor(() => assert.ok(screen.getByText("PAID")), { timeout: 4_000 })
    await waitFor(() => assert.ok(screen.getByText("idle")))
    assert.equal(requests, 3)
})
