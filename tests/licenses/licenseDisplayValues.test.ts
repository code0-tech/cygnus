import assert from "node:assert/strict"
import test from "node:test"
import type { LicenseContent } from "../../src/lib/cms"
import { formatInvoiceNumber, formatLicenseDisplayValue } from "../../src/lib/licenses/displayValues"

const labels = {
    customerTypes: { personal: "Privat", business: "Geschäftlich" },
    deploymentTypes: { cloud: "Cloud", selfHosted: "Eigenbetrieb" },
    paymentPeriods: { monthly: "Monatlich", quarterly: "Vierteljährlich", yearly: "Jährlich" },
    statuses: { active: "Aktiv", pending: "Ausstehend", incomplete: "Incomplete", incompleteExpired: "Expired", paused: "Paused", trialing: "Trial", unpaid: "Unpaid", pastDue: "Zahlung fehlgeschlagen", canceled: "Gekündigt" },
    invoiceStatuses: { paid: "Bezahlt", draft: "Entwurf", open: "Offen", uncollectible: "Uneinbringlich", void: "Storniert" },
    plans: { pro: "Pro", max: "Max", custom: "Individuell" },
    editions: { cloud: "Cloud Edition", selfHosted: "Enterprise Edition" },
    unknown: "Unbekannt",
} satisfies LicenseContent["values"]

test("formats Crater license values with CMS labels", () => {
    assert.equal(formatLicenseDisplayValue("business", "customerType", labels), "Geschäftlich")
    assert.equal(formatLicenseDisplayValue("SELF_HOSTED", "deploymentType", labels), "Eigenbetrieb")
    assert.equal(formatLicenseDisplayValue("MONTHLY", "paymentPeriod", labels), "Monatlich")
    assert.equal(formatLicenseDisplayValue("PAST_DUE", "status", labels), "Zahlung fehlgeschlagen")
    assert.equal(formatLicenseDisplayValue("custom", "plan", labels), "Individuell")
    assert.equal(formatLicenseDisplayValue("uncollectible", "invoiceStatus", labels), "Uneinbringlich")
})

test("uses the CMS fallback for missing or unknown values", () => {
    assert.equal(formatLicenseDisplayValue(undefined, "status", labels), "Unbekannt")
    assert.equal(formatLicenseDisplayValue("future_status", "status", labels), "Unbekannt")
})

test("shows the CMS placeholder instead of an internal ID while the invoice number is missing", () => {
    const invoiceLabels = { numberPendingLabel: "Noch nicht verfügbar" } as LicenseContent["invoices"]

    assert.equal(formatInvoiceNumber("INV-0001", invoiceLabels), "INV-0001")
    assert.equal(formatInvoiceNumber(undefined, invoiceLabels), "Noch nicht verfügbar")
    assert.equal(formatInvoiceNumber(null, invoiceLabels), "Noch nicht verfügbar")
    assert.equal(formatInvoiceNumber("  ", invoiceLabels), "Noch nicht verfügbar")
})
