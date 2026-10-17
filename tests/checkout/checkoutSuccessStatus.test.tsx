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
        Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
    },
})
mock.module("@number-flow/react", {
    defaultExport: ({ value }: { value: number }) => <span>{value}</span>,
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

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
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
    licenseStatusRetryLabel: "Try again",
    receiptHint: "Stripe sends the receipt to your email address.",
    failedHeading: "Payment failed",
    failedDescription: "Stripe could not process your payment.",
    invalidHeading: "Checkout link is no longer valid",
    invalidDescription: "The link has expired or belongs to another account.",
    checkoutRetryLabel: "Back to checkout",
}

const errorMessage = "Could not confirm the license."
const checkoutSearchParams = new URLSearchParams({ session_id: "cs_test", plan: "pro", customerType: "b2b", paymentPeriod: "monthly" })
const pricingContent = {
    deploymentIcons: { cloud: "cloud", selfHosted: "server" },
    deploymentIconColor: "aqua",
    customerTypeIcons: { b2b: "building", b2c: "user" },
    customerTypeIconColor: "yellow",
    pricing: {
        planLabel: "Plan",
        baseLabel: "AI Tokens",
        workflowExecutionsLabel: "Workflow Executions",
        discountInputPlaceholder: "Discount code",
        taxLabel: "Tax",
        totalLabel: "Total",
    },
} as CheckoutData["summary"]
const subscriptionConfig = {
    packages: { pro: { title: "Pro" }, max: { title: "Max" }, custom: { title: "Custom" } },
    plan: {
        pro: { title: "Pro", icon: "pro", color: "lime" },
        max: { title: "Max", icon: "max", color: "magenta" },
        custom: { title: "Custom", icon: "custom", color: "yellow" },
    },
    paymentPeriod: { monthlyPeriodSuffix: "/ month", quarterlyPeriodSuffix: "/ quarter", yearlyPeriodSuffix: "/ year" },
} as never
const completedConfiguration = {
    aiTokens: null,
    customerType: "business",
    deploymentType: "self_hosted",
    paymentPeriod: "MONTHLY",
    plan: "pro",
    workflowExecutions: null,
}
const completedPricing = { currency: "eur", discount: 1_000, subtotal: 10_000, tax: 1_710, total: 10_710 }
const sharedProps = { pricingContent, subscriptionConfig }

function respondWith(body: unknown, status = 200) {
    const responseBody =
        body && typeof body === "object" && "state" in body
            ? {
                  configuration: COMPLETED_TEST_STATES.has(String(body.state)) ? completedConfiguration : null,
                  pricing: COMPLETED_TEST_STATES.has(String(body.state)) ? completedPricing : null,
                  ...body,
              }
            : body
    globalThis.fetch = (async () => new Response(JSON.stringify(responseBody), { status, headers: { "content-type": "application/json" } })) as typeof fetch
}
const COMPLETED_TEST_STATES = new Set(["PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY"])

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
                configuration: completedConfiguration,
                pricing: completedPricing,
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(<CheckoutSuccessStatus {...sharedProps} checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByRole("button", { name: content.licenseStatusRetryLabel }))
    assert.equal(requests, 1)
    assert.equal(screen.queryByText(content.licensePendingLabel), null)
    assert.ok(screen.getByText(errorMessage))
})

test("explains a declined payment and redirects back into checkout with the failure flagged", async () => {
    respondWith({ state: "FAILED", customerId: "gid://crater/Customer/1", licenseId: null })

    render(<CheckoutSuccessStatus {...sharedProps} checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.failedHeading))
    assert.ok(screen.getByText(content.failedDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/en/checkout")
    assert.equal(screen.queryByText(content.heading), null)
    assert.equal(screen.queryByText(content.receiptHint), null)
    await waitFor(() => {
        assert.deepEqual(routerReplaceCalls, ["/en/checkout?plan=pro&customerType=b2b&paymentPeriod=monthly&paymentFailed=1"])
    })
})

test("explains a checkout session that cannot be verified", async () => {
    respondWith({ error: "The checkout session could not be verified.", errorCode: "INVALID_CHECKOUT_STATUS_SESSION" }, 404)

    render(<CheckoutSuccessStatus {...sharedProps} checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="de" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.invalidHeading))
    assert.ok(screen.getByText(content.invalidDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/de/checkout")
    assert.deepEqual(routerReplaceCalls, [])
})

test("shows Crater's confirmed Stripe pricing once payment is confirmed", async () => {
    respondWith({ state: "FULFILLMENT_PENDING", customerId: "gid://crater/Customer/1", licenseId: null })

    render(
        <CheckoutSuccessStatus
            {...sharedProps}
            checkoutSearchParams={checkoutSearchParams}
            content={content}
            errorMessage={errorMessage}
            locale="en"
            sessionId="cs_test"
        />
    )

    assert.ok(await screen.findByText(content.heading))
    assert.ok(screen.getByText("€100.00"))
    assert.ok(screen.getByText("-€10.00"))
    assert.ok(screen.getByText("€17.10"))
    assert.ok(screen.getByText("107.1"))
    assert.ok(screen.getByText(content.receiptHint))
})

test("keeps polling the license when Crater has not exposed the optional pricing yet", async () => {
    respondWith({
        state: "FULFILLMENT_PENDING",
        customerId: "gid://crater/Customer/1",
        licenseId: null,
        configuration: null,
        pricing: null,
    })

    render(<CheckoutSuccessStatus {...sharedProps} checkoutSearchParams={checkoutSearchParams} content={content} errorMessage={errorMessage} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.heading))
    assert.ok(screen.getByRole("button", { name: content.licensePendingLabel }))
    assert.equal(screen.queryByText(errorMessage), null)
})

test("offers Sculptor next to the license dashboard for a cloud license", async () => {
    respondWith({
        state: "READY",
        customerId: "gid://crater/Customer/1",
        licenseId: "gid://crater/License/2",
        configuration: { ...completedConfiguration, deploymentType: "cloud" },
    })

    render(
        <CheckoutSuccessStatus
            {...sharedProps}
            checkoutSearchParams={checkoutSearchParams}
            content={content}
            errorMessage={errorMessage}
            locale="en"
            sculptorUrl="https://sculptor.example/cloud"
            sessionId="cs_test"
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
            {...sharedProps}
            checkoutSearchParams={checkoutSearchParams}
            content={content}
            errorMessage={errorMessage}
            locale="en"
            sculptorUrl="https://sculptor.example/cloud"
            sessionId="cs_test"
        />
    )

    await userEvent.setup().click(await screen.findByRole("button", { name: content.licenseDownloadLabel }))
    assert.deepEqual(downloadedLicenseIds, ["gid://crater/License/2"])
    assert.equal(screen.queryByRole("link", { name: content.sculptorLabel }), null)
})
