import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { SubscriptionPendingUpdateNotice } from "../../src/components/licenses/shared/SubscriptionPendingUpdateNotice"
import type { LicenseContent } from "../../src/lib/cms"

const content = {
    values: {
        plans: { pro: "Pro", max: "Max", custom: "Custom" },
        paymentPeriods: { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" },
        statuses: {},
        invoiceStatuses: {},
        customerTypes: {},
        deploymentTypes: {},
        unknown: "Unknown",
    },
    dashboard: { workflowExecutionsLabel: "Workflows", aiTokensLabel: "Tokens" },
    subscriptionPreview: { pendingChangeText: "Switch to {selection} on {date}." },
} as LicenseContent

test("scheduled changes include selection, quantities and the effective date", () => {
    const markup = renderToStaticMarkup(
        <SubscriptionPendingUpdateNotice
            update={{ plan: "max", paymentPeriod: "yearly", aiTokens: 0, workflowExecutions: 100000, effectiveAt: "2026-11-01T00:00:00Z" }}
            content={content}
            locale="en"
        />
    )
    assert.match(markup, /Switch to Max/)
    assert.match(markup, /Yearly/)
    assert.match(markup, /100,000 Workflows/)
    assert.match(markup, /0 Tokens/)
    assert.match(markup, /Nov 1, 2026/)
    assert.equal(renderToStaticMarkup(<SubscriptionPendingUpdateNotice update={null} content={content} locale="en" />), "")
})
