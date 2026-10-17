import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { ErrorsContent } from "../../src/lib/cms"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import { licenseToastContent } from "../helpers/licenseToasts"

installDomTestEnvironment("https://code0.example/de/licenses")
const notifications: Array<{ title: string; color: string; children?: string }> = []
mock.module("@code0-tech/pictor", { namedExports: { toast: (value: typeof notifications[number]) => { notifications.push(value); return "toast" } } })
mock.module("sonner", { namedExports: { Toaster: () => null } })
mock.module("next/navigation", { namedExports: { usePathname: () => window.location.pathname } })
const { render, cleanup } = await import("@testing-library/react")
const { LicenseNotifications } = await import("../../src/components/licenses/layout/LicenseNotifications")
const { licenseSuccessToast } = await import("../../src/lib/licenses/toasts")
const errors = { namespaceInUse: "Namespace already in use", licenseUpdate: "Could not link namespace" } as ErrorsContent
const props = { errors, locale: "de" as const, toasts: licenseToastContent }

afterEach(() => { cleanup(); notifications.length = 0; window.history.replaceState({}, "", "/de/licenses") })

test("namespace conflicts notify once and preserve the remaining URL in Strict Mode", () => {
    window.history.replaceState({}, "", "/de/licenses/customer/1/license/2/edit?tab=general&namespaceError=occupied#details")
    render(<React.StrictMode><LicenseNotifications {...props} /></React.StrictMode>)
    assert.deepEqual(notifications, [{ title: licenseToastContent.errorTitle, color: "error", children: errors.namespaceInUse }])
    assert.equal(window.location.search, "?tab=general")
    assert.equal(window.location.hash, "#details")
})

test("namespace success uses the CMS copy and is consumed before remounting", () => {
    window.history.replaceState({}, "", "/de/licenses?namespaceLinked=true")
    render(<LicenseNotifications {...props} />)
    cleanup()
    render(<LicenseNotifications {...props} />)
    assert.deepEqual(notifications, [{ title: "Namespace linked", color: "success", children: "Namespace verknüpft." }])
    assert.equal(window.location.search, "")
})

test("a namespace error takes precedence over a success marker", () => {
    window.history.replaceState({}, "", "/de/licenses?namespaceLinked=true&namespaceError=session")
    render(<LicenseNotifications {...props} />)
    assert.deepEqual(notifications, [{ title: licenseToastContent.errorTitle, color: "error", children: errors.licenseUpdate }])
})

test("scheduled changes insert their effective date into the CMS description", () => {
    licenseSuccessToast(licenseToastContent, "changeScheduled", "en", "2026-11-01T00:00:00Z")
    assert.deepEqual(notifications, [{ title: "Subscription change scheduled", color: "success", children: "Applies on Nov 1, 2026." }])
})

test("a date description without a known date falls back to the title only", () => {
    licenseSuccessToast(licenseToastContent, "cancellationScheduled", "en", null)
    assert.deepEqual(notifications, [{ title: "Cancellation scheduled", color: "success" }])
})
