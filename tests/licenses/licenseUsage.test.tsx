import assert from "node:assert/strict"
import test, { mock } from "node:test"
import React from "react"
import type { Customer, Subscription, SubscriptionUsage, SubscriptionUsageAvailability } from "@code0-tech/crater-graphql-types"
import type { LicenseUsage } from "../../src/lib/licenses/types"

mock.module("@code0-tech/pictor", {
    namedExports: {
        Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ProgressLinear: ({ value, color, "aria-label": label }: { value: number; color: string; "aria-label": string }) => (
            <div role="progressbar" aria-label={label} aria-valuenow={value} data-color={color} />
        ),
        Spacing: () => null,
        Text: ({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) => (
            <span id={id} className={className}>
                {children}
            </span>
        ),
    },
})

const { mapSubscription, mapSubscriptionUsage } = await import("../../src/lib/licenses/dashboardMapper")
const { formatUsageAmount, getUsagePercent } = await import("../../src/lib/licenses/usage")
const { LicenseUsageCard } = await import("../../src/components/licenses/shared/LicenseUsageCard")
const { renderToStaticMarkup } = await import("react-dom/server")

const availability = (value: string) => value as SubscriptionUsageAvailability
const customer: Customer = { id: "gid://crater/Customer/1", name: "Customer" }
const subscription: Subscription = { id: "gid://crater/Subscription/2" }
const availableUsage: SubscriptionUsage = {
    availability: availability("AVAILABLE"),
    periodStart: "2026-11-01T00:00:00Z",
    periodEnd: "2026-12-01T00:00:00Z",
    resetsAt: "2026-12-01T00:00:00Z",
    lastUpdatedAt: "2026-11-18T10:15:00Z",
    aiTokens: { used: "1250000", allowance: "4000000", remaining: "2750000", exceeded: false },
    workflowExecutions: { used: "26000", allowance: "25000", remaining: "0", exceeded: true },
}

const content = {
    aiTokensLabel: "AI tokens",
    workflowExecutionsLabel: "Workflow executions",
    usageLabel: "Usage",
    usageDescription: "Consumption in the current usage period.",
    usageOfLabel: "of {allowance}",
    usageRemainingLabel: "{remaining} remaining",
    usageUnlimitedLabel: "Unlimited",
    usageExceededLabel: "Allowance exceeded",
    usageResetsAtLabel: "Resets on {date}",
    usageUpdatedAtLabel: "Updated {time}",
    usageUnavailableDescription: "Usage can't be loaded right now.",
}

function renderCard(usage: LicenseUsage | undefined) {
    return renderToStaticMarkup(<LicenseUsageCard content={content} locale="en" usage={usage} />)
}

test("maps available usage with its BigInt amounts kept as decimal strings", () => {
    assert.deepEqual(mapSubscription({ ...subscription, usage: availableUsage }, customer)?.usage, {
        availability: "available",
        aiTokens: { used: "1250000", allowance: "4000000", remaining: "2750000", exceeded: false },
        workflowExecutions: { used: "26000", allowance: "25000", remaining: "0", exceeded: true },
        lastUpdatedAt: "2026-11-18T10:15:00Z",
        periodEnd: "2026-12-01T00:00:00Z",
        periodStart: "2026-11-01T00:00:00Z",
        resetsAt: "2026-12-01T00:00:00Z",
    })
    // Queries without usage (dashboard, customer page) map no usage at all.
    assert.equal(mapSubscription(subscription, customer)?.usage, undefined)
})

test("keeps an unlimited allowance unlimited and real zeros as zeros", () => {
    const mapped = mapSubscriptionUsage({ ...availableUsage, aiTokens: { used: "0", allowance: null, remaining: null, exceeded: false }, workflowExecutions: null })
    assert.deepEqual(mapped?.aiTokens, { used: "0", allowance: null, remaining: null, exceeded: false })
    assert.equal(mapped?.workflowExecutions, null)
    assert.equal(mapped?.availability, "available")
})

test("never turns unavailable, unsupported or malformed usage into numbers", () => {
    for (const state of ["UNAVAILABLE", "UNSUPPORTED"]) {
        const mapped = mapSubscriptionUsage({ ...availableUsage, availability: availability(state) })
        assert.equal(mapped?.availability, state.toLowerCase())
        assert.equal(mapped?.aiTokens, null)
        assert.equal(mapped?.workflowExecutions, null)
        assert.equal(mapped?.lastUpdatedAt, null)
    }
    // AVAILABLE without a single readable metric is no usable answer either.
    assert.equal(mapSubscriptionUsage({ ...availableUsage, aiTokens: { used: "-1" }, workflowExecutions: { used: "1.5" } })?.availability, "unavailable")
    assert.equal(mapSubscriptionUsage({ ...availableUsage, availability: availability("SOMETHING_NEW") }), null)
    assert.equal(mapSubscriptionUsage(null), null)
})

test("computes the used share on bigint, capped at 100 and precise beyond Number's safe range", () => {
    assert.equal(getUsagePercent({ used: "1250000", allowance: "4000000", remaining: "2750000", exceeded: false }), 31.2)
    assert.equal(getUsagePercent({ used: "26000", allowance: "25000", remaining: "0", exceeded: true }), 100)
    assert.equal(getUsagePercent({ used: "5", allowance: null, remaining: null, exceeded: false }), null)
    assert.equal(getUsagePercent({ used: "0", allowance: "0", remaining: "0", exceeded: false }), 0)
    assert.equal(getUsagePercent({ used: "9007199254740993", allowance: "18014398509481986", remaining: "9007199254740993", exceeded: false }), 50)
    assert.equal(formatUsageAmount("9007199254740993", "en"), "9,007,199,254,740,993")
    assert.equal(formatUsageAmount("1250000", "de"), "1.250.000")
})

test("shows both metrics with progress, remaining and exceeded state, reset and update time", () => {
    const html = renderCard(mapSubscriptionUsage(availableUsage)!)
    assert.match(html, /Usage/)
    assert.match(html, /1,250,000/)
    assert.match(html, /of 4,000,000/)
    assert.match(html, /2,750,000 remaining/)
    assert.match(html, /aria-label="AI tokens" aria-valuenow="31.2" data-color="var\(--color-brand\)"/)
    assert.match(html, /aria-label="Workflow executions" aria-valuenow="100" data-color="var\(--color-error\)"/)
    assert.match(html, /Allowance exceeded/)
    assert.match(html, /Resets on Dec 1, 2026/)
    assert.match(html, /Updated Nov 18, 2026/)
})

test("an unlimited metric shows no progress bar", () => {
    const html = renderCard(mapSubscriptionUsage({ ...availableUsage, aiTokens: { used: "42", allowance: null, remaining: null, exceeded: false }, workflowExecutions: null })!)
    assert.match(html, /Unlimited/)
    assert.doesNotMatch(html, /role="progressbar"/)
})

test("unavailable usage shows a notice instead of zeros, unsupported and missing usage show nothing", () => {
    const unavailable = renderCard(mapSubscriptionUsage({ ...availableUsage, availability: availability("UNAVAILABLE"), lastUpdatedAt: null })!)
    assert.match(unavailable, /Usage can&#x27;t be loaded right now\./)
    assert.doesNotMatch(unavailable, /role="progressbar"|remaining|of /)
    assert.equal(renderCard(mapSubscriptionUsage({ ...availableUsage, availability: availability("UNSUPPORTED") })!), "")
    assert.equal(renderCard(undefined), "")
})
