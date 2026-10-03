import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { InvoiceDetails } from "../../src/components/licenses/InvoiceDetails"
import { SubscriptionPendingUpdateNotice } from "../../src/components/licenses/SubscriptionPendingUpdateNotice"
import type { LicenseContent } from "../../src/lib/cms"

const invoiceLabels: LicenseContent["invoices"] = {
    title: "Invoices",
    description: "Invoices",
    empty: "None",
    numberLabel: "Invoice",
    billingDateLabel: "Date",
    amountLabel: "Total",
    statusLabel: "Status",
    downloadLabel: "Download",
    viewLabel: "View",
    unavailableLabel: "Unavailable",
    lineItemsLabel: "Items",
    quantityLabel: "Quantity",
    netLabel: "Net",
    taxLabel: "Tax",
}

test("invoice details show line items and zero tax using the invoice currency", () => {
    const markup = renderToStaticMarkup(
        <InvoiceDetails
            invoice={{ id: "invoice-1", currency: "eur", net: 1200, tax: 0, total: 1200, lineItems: [{ description: "Pro", quantity: 1, amount: 1200 }] }}
            labels={invoiceLabels}
            locale="en"
        />
    )
    assert.match(markup, /Pro/)
    assert.match(markup, /Net/)
    assert.match(markup, /Tax/)
    assert.match(markup, /0[.,]00/)
    assert.match(markup, /12[.,]00/)
})

test("invoice details do not invent missing tax or line items", () => {
    assert.equal(renderToStaticMarkup(<InvoiceDetails invoice={{ id: "invoice-1" }} labels={invoiceLabels} locale="en" />), "")
    const markup = renderToStaticMarkup(<InvoiceDetails invoice={{ id: "invoice-1", total: 1200 }} labels={invoiceLabels} locale="en" />)
    assert.match(markup, /Unavailable/)
    assert.doesNotMatch(markup, /<dt>Tax/)
})

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
