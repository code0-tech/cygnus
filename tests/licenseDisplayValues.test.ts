import assert from "node:assert/strict"
import test from "node:test"
import type { LicenseContent } from "../src/lib/cms"
import { formatLicenseDisplayValue } from "../src/lib/licenses/licenseDisplayValues"

const labels = {
    customerTypes: { personal: "Privat", business: "Geschäftlich" },
    deploymentTypes: { cloud: "Cloud", selfHosted: "Eigenbetrieb" },
    paymentPeriods: { weekly: "Wöchentlich", monthly: "Monatlich", quarterly: "Vierteljährlich", yearly: "Jährlich" },
    statuses: { active: "Aktiv", paid: "Bezahlt", paymentFailed: "Zahlung fehlgeschlagen", canceled: "Gekündigt", expired: "Abgelaufen" },
    invoiceStatuses: { draft: "Entwurf", open: "Offen", paid: "Bezahlt", uncollectible: "Uneinbringlich", void: "Storniert" },
    plans: { pro: "Pro", max: "Max", custom: "Individuell" },
    unknown: "Unbekannt",
} satisfies LicenseContent["values"]

test("formats Crater license values with CMS labels", () => {
    assert.equal(formatLicenseDisplayValue("business", "customerType", labels), "Geschäftlich")
    assert.equal(formatLicenseDisplayValue("SELF_HOSTED", "deploymentType", labels), "Eigenbetrieb")
    assert.equal(formatLicenseDisplayValue("MONTHLY", "paymentPeriod", labels), "Monatlich")
    assert.equal(formatLicenseDisplayValue("payment_failed", "status", labels), "Zahlung fehlgeschlagen")
    assert.equal(formatLicenseDisplayValue("custom", "plan", labels), "Individuell")
    assert.equal(formatLicenseDisplayValue("uncollectible", "invoiceStatus", labels), "Uneinbringlich")
})

test("uses the CMS fallback for missing or unknown values", () => {
    assert.equal(formatLicenseDisplayValue(undefined, "status", labels), "Unbekannt")
    assert.equal(formatLicenseDisplayValue("future_status", "status", labels), "Unbekannt")
})
