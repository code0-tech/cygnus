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
    backToHomepageLabel: "Back to homepage",
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
})
