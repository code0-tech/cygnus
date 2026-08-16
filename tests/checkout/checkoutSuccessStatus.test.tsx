import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData } from "../../src/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/checkout/success?session_id=cs_test")

mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
})
mock.module("next/link", {
    defaultExport: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
})
// The real getIcon pulls in @mvriu5/payload-icon-picker, which imports a .css file Node's test runner cannot load.
mock.module("@/components/ui/IconRenderer", {
    namedExports: {
        getIcon: (icon: string | null | undefined) => <span data-icon={icon ?? undefined} />,
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const { CheckoutSuccessStatus } = await import("../../src/components/checkout/CheckoutSuccessStatus")
const originalFetch = globalThis.fetch
const originalDateNow = Date.now

const content: CheckoutData["success"] = {
    heading: "Checkout complete",
    description: "Your subscription is ready.",
    licenseDashboardLabel: "Open licenses",
    licensePendingLabel: "Preparing license",
    licenseReadyLabel: "License ready",
    licenseStatusError: "Could not confirm the license.",
    licenseStatusRetryLabel: "Try again",
    receiptHint: "Stripe sends the receipt to your email address.",
    failedHeading: "Payment failed",
    failedDescription: "Stripe could not process your payment.",
    invalidHeading: "Checkout link is no longer valid",
    invalidDescription: "The link has expired or belongs to another account.",
    checkoutRetryLabel: "Back to checkout",
    backToHomepageLabel: "Back to homepage",
}

function respondWith(body: unknown, status = 200) {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as typeof fetch
}

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    Date.now = originalDateNow
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

    render(<CheckoutSuccessStatus content={content} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByRole("button", { name: content.licenseStatusRetryLabel }))
    assert.equal(requests, 1)
    assert.equal(screen.queryByText(content.licensePendingLabel), null)
    assert.ok(screen.getByText(content.licenseStatusError))
})

test("explains a declined payment and offers a way back into the checkout", async () => {
    respondWith({ state: "FAILED", customerId: "gid://crater/Customer/1", licenseId: null })

    render(<CheckoutSuccessStatus content={content} locale="en" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.failedHeading))
    assert.ok(screen.getByText(content.failedDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/en/checkout")
    assert.equal(screen.queryByText(content.heading), null)
    assert.equal(screen.queryByText(content.receiptHint), null)
})

test("explains a checkout session that cannot be verified", async () => {
    respondWith({ error: "The checkout session could not be verified.", errorCode: "INVALID_CHECKOUT_STATUS_SESSION" }, 404)

    render(<CheckoutSuccessStatus content={content} locale="de" sessionId="cs_test" />)

    assert.ok(await screen.findByText(content.invalidHeading))
    assert.ok(screen.getByText(content.invalidDescription))
    assert.equal(screen.getByRole("link", { name: content.checkoutRetryLabel }).getAttribute("href"), "/de/checkout")
})

test("shows the order summary and the receipt hint once the payment is confirmed", async () => {
    respondWith({ state: "FULFILLMENT_PENDING", customerId: "gid://crater/Customer/1", licenseId: null })
    const summary = {
        title: "Your configuration",
        rows: [
            { id: "plan", label: "Plan", value: "Custom", icon: "tabler:IconSettings", tone: "aqua" as const },
            { id: "paymentPeriod", label: "Payment period", value: "Yearly", icon: "tabler:IconCalendarMonth", tone: "magenta" as const },
            { id: "aiTokens", label: "AI Tokens", value: "1M", icon: "tabler:IconBrain", tone: "magenta" as const },
        ],
    }

    render(<CheckoutSuccessStatus content={content} locale="en" sessionId="cs_test" summary={summary} />)

    assert.ok(await screen.findByText(content.heading))
    assert.ok(screen.getByText(summary.title))
    assert.ok(screen.getByText("Yearly"))
    assert.ok(screen.getByText("1M"))
    assert.ok(screen.getByText(content.receiptHint))
})
