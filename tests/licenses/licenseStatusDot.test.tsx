import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

test("shows paid license statuses in green regardless of Crater casing", () => {
    for (const status of ["paid", "PAID", " Paid "]) {
        assert.match(renderToStaticMarkup(<LicenseStatusDot status={status} />), /bg-brand/)
    }
})
