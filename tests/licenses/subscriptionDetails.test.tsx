import assert from "node:assert/strict"
import test from "node:test"
import { formatPendingUpdateSelection, resolvePendingUpdateDate } from "../../src/lib/licenses/pendingUpdate"
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
} as LicenseContent

test("a scheduled change is summarized with plan, period and quantities", () => {
    const selection = formatPendingUpdateSelection({ plan: "max", paymentPeriod: "yearly", aiTokens: 0, workflowExecutions: 100000 }, content, "en")

    assert.equal(selection, "Max · Yearly · 100,000 Workflows · 0 Tokens")
    assert.equal(formatPendingUpdateSelection({ paymentPeriod: "quarterly" }, content, "en"), "Quarterly")
})

test("without a scheduled change there is nothing to summarize", () => {
    assert.equal(formatPendingUpdateSelection(null, content, "en"), null)
    assert.equal(formatPendingUpdateSelection({}, content, "en"), null)
})

test("the effective date wins over the period end and invalid dates fall back", () => {
    assert.equal(resolvePendingUpdateDate({ effectiveAt: "2026-11-01T00:00:00Z" }, "2026-12-01T00:00:00Z")?.toISOString(), "2026-11-01T00:00:00.000Z")
    assert.equal(resolvePendingUpdateDate({}, "2026-12-01T00:00:00Z")?.toISOString(), "2026-12-01T00:00:00.000Z")
    assert.equal(resolvePendingUpdateDate({ effectiveAt: "not a date" }, "2026-12-01T00:00:00Z")?.toISOString(), "2026-12-01T00:00:00.000Z")
    assert.equal(resolvePendingUpdateDate({}, null), null)
})
