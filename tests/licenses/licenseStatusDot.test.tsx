import { LicenseStatusDot, getLicenseStatusTone, isLicenseStatusError } from "@/components/licenses/shared/LicenseStatusDot"
import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

test("shows active and trial subscriptions in green", () => {
    for (const status of ["ACTIVE", "TRIALING", " Active "]) assert.match(renderToStaticMarkup(<LicenseStatusDot status={status} />), /bg-brand/)
})

test("distinguishes payment failures, terminal states and pending access", () => {
    for (const status of ["PAST_DUE", "UNPAID"]) {
        assert.equal(getLicenseStatusTone(status), "error")
        assert.equal(isLicenseStatusError(status), true)
    }
    for (const status of ["CANCELED", "INCOMPLETE_EXPIRED"]) assert.equal(getLicenseStatusTone(status), "muted")
    for (const status of ["INCOMPLETE", "PAUSED", "pending", undefined]) {
        assert.equal(getLicenseStatusTone(status), "warning")
        assert.equal(isLicenseStatusError(status), false)
    }
})
