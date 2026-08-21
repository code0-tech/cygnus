import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData } from "../../src/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/checkout/success?session_id=cs_test")

mock.module("@code0-tech/pictor", {
    namedExports: {
        Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span>,
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
})
mock.module("next/link", {
    defaultExport: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
})
let routerReplaceCalls: string[] = []
mock.module("next/navigation", {
    namedExports: {
        useRouter: () => ({
            replace: (url: string) => {
                routerReplaceCalls.push(url)
            },
        }),
    },
})
// The real getIcon pulls in @mvriu5/payload-icon-picker, which imports a .css file Node's test runner cannot load.
mock.module("@/components/ui/IconRenderer", {
    namedExports: {
        getIcon: (icon: string | null | undefined) => <span data-icon={icon ?? undefined} />,
    },
})
let downloadedLicenseIds: string[] = []
mock.module("@/lib/licenses/downloadLicenseFile", {
    namedExports: {
        downloadLicenseFile: async (licenseId: string) => {
            downloadedLicenseIds.push(licenseId)
        },
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutSuccessStatus } = await import("../../src/components/checkout/CheckoutSuccessStatus")
const originalFetch = globalThis.fetch
const originalDateNow = Date.now

const content: CheckoutData["success"] = {
    heading: "Checkout complete",
    description: "Your subscription is ready.",
    licenseDashboardLabel: "Open licenses",
    sculptorLabel: "Open Sculptor",
    licenseDownloadLabel: "Download license",
    licenseDownloadError: "Could not download license.",
    licensePendingLabel: "Preparing license",
    licenseReadyLabel: "License ready",
    licenseStatusRetryLabel: "Try again",
    receiptHint: "Stripe sends the receipt to your email address.",
    failedHeading: "Payment failed",
    failedDescription: "Stripe could not process your payment.",
    invalidHeading: "Checkout link is no longer valid",
    invalidDescription: "The link has expired or belongs to another account.",
    checkoutRetryLabel: "Back to checkout",
    backToHomepageLabel: "Back to homepage",
}

const errorMessage = "Could not confirm the license."
const checkoutSearchParams = new URLSearchParams({ session_id: "cs_test", plan: "pro", customerType: "b2b", paymentPeriod: "monthly" })

function respondWith(body: unknown, status = 200) {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as typeof fetch
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    Date.now = originalDateNow
    routerReplaceCalls = []
    downloadedLicenseIds = []
})

test("stops checkout success polling after the configured time limit", async () => {
    let now = 1_000_000
    let requests = 0
    Date.now = () => now
    globalThis.fetch = (async () => {
        requests += 1
        now += 5 * 60_000
        return new Response(
            JSON.stringify({
                state: "FULFILLMENT_PENDING",
                customerId: "gid://crater/Customer/1",
                licenseId: null,
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(<CheckoutSuccessStatus checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByRole("button", { name: content.licenseStatusRetryLabel }))
    assert.equal(requests, 1)
    assert.equal(screen.queryByText(content.licensePendingLabel), null)
    assert.ok(screen.getByText(errorMessage))
})

test("explains a declined payment and redirects back into checkout with the failure flagged", async () => {
    respondWith({ state: "FAILED", customerId: "gid://crater/Customer/1", licenseId: null })

    render(<CheckoutSuccessStatus checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.failedHeading))
    assert.ok(screen.getByText(content.failedDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/en/checkout")
    assert.equal(screen.queryByText(content.heading), null)
    assert.equal(screen.queryByText(content.receiptHint), null)
    assert.deepEqual(routerReplaceCalls, ["/en/checkout?plan=pro&customerType=b2b&paymentPeriod=monthly&paymentFailed=1"])
})

test("explains a checkout session that cannot be verified", async () => {
    respondWith({ error: "The checkout session could not be verified.", errorCode: "INVALID_CHECKOUT_STATUS_SESSION" }, 404)

    render(<CheckoutSuccessStatus checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="de" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.invalidHeading))
    assert.ok(screen.getByText(content.invalidDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/de/checkout")
    assert.deepEqual(routerReplaceCalls, [])
})

test("shows the order summary and the receipt hint once the payment is confirmed", async () => {
    respondWith({ state: "FULFILLMENT_PENDING", customerId: "gid://crater/Customer/1", licenseId: null })
    const summary = {
        deployment: "self_hosted" as const,
        title: "Your configuration",
        rows: [
            { id: "plan", label: "Plan", value: "Custom", icon: "tabler:IconSettings", tone: "aqua" as const },
            { id: "paymentPeriod", label: "Payment period", value: "Yearly", icon: "tabler:IconCalendarMonth", tone: "magenta" as const },
            { id: "aiTokens", label: "AI Tokens", value: "1M", icon: "tabler:IconBrain", tone: "magenta" as const },
        ],
    }

    render(<CheckoutSuccessStatus checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" summary={summary} />)

    assert.ok(await screen.findByText(content.heading))
    assert.ok(screen.getByText(summary.title))
    assert.ok(screen.getByText("Yearly"))
    assert.ok(screen.getByText("1M"))
    assert.ok(screen.getByText(content.receiptHint))
})

test("offers Sculptor next to the license dashboard for a cloud license", async () => {
    respondWith({ state: "READY", customerId: "gid://crater/Customer/1", licenseId: "gid://crater/License/2" })

    render(
        <CheckoutSuccessStatus
            checkoutSearchParams={checkoutSearchParams}
            content={content}
            errorMessage={errorMessage}
            locale="en"
            sculptorUrl="https://sculptor.example/cloud"
            sessionId="cs_test"
            summary={{ deployment: "cloud", title: "Configuration", rows: [] }}
        />
    )

    assert.equal((await screen.findByRole("link", { name: content.licenseDashboardLabel })).getAttribute("href")?.startsWith("/api/crater/licenses/access"), true)
    assert.equal(screen.getByRole("link", { name: content.sculptorLabel }).getAttribute("href"), "https://sculptor.example/cloud")
    assert.equal(screen.queryByRole("button", { name: content.licenseDownloadLabel }), null)
})

test("downloads the Crater license next to the dashboard for self-hosted", async () => {
    respondWith({ state: "READY", customerId: "gid://crater/Customer/1", licenseId: "gid://crater/License/2" })

    render(
        <CheckoutSuccessStatus
            checkoutSearchParams={checkoutSearchParams}
            content={content}
            errorMessage={errorMessage}
            locale="en"
            sculptorUrl="https://sculptor.example/cloud"
            sessionId="cs_test"
            summary={{ deployment: "self_hosted", title: "Configuration", rows: [] }}
        />
    )

    await userEvent.setup().click(await screen.findByRole("button", { name: content.licenseDownloadLabel }))
    assert.deepEqual(downloadedLicenseIds, ["gid://crater/License/2"])
    assert.equal(screen.queryByRole("link", { name: content.sculptorLabel }), null)
})
