import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ReactNode, type ButtonHTMLAttributes } from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import type { LicenseDashboardLicense } from "../../src/lib/licenses/types"
import type { ErrorsContent, LicenseContent } from "../../src/lib/cms"

installDomTestEnvironment()
let license: LicenseDashboardLicense
const updates: unknown[] = []
const navigation: string[] = []
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, variant: _variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => <button {...props}>{children}</button>,
        DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    },
})
mock.module("next/navigation", {
    namedExports: { useRouter: () => ({ replace: (path: string) => navigation.push(path) }) },
})
mock.module("@/components/licenses/data/LicenseDataProvider", {
    namedExports: { useLicenseData: () => ({ licenses: [license], updateLicense: (_id: string, values: unknown) => updates.push(values) }) },
})
mock.module("@/components/licenses/dialog/shared/LicenseDialog", {
    namedExports: { LicenseDialog: ({ children }: { children: ReactNode }) => <div>{children}</div> },
})
const { render, cleanup, screen, fireEvent, waitFor } = await import("@testing-library/react")
const { LicenseCancelDialog } = await import("../../src/components/licenses/dialog/subscription/LicenseCancelDialog")
const originalFetch = globalThis.fetch
const content = {
    values: { statuses: { canceled: "Canceled", incompleteExpired: "Expired" } },
    editor: { closeLabel: "Close" },
    cancel: {
        confirmLabel: "Cancel at period end",
        resumeLabel: "Keep my subscription",
        immediateConfirmLabel: "Cancel immediately",
        immediateDescription: "Immediate cancellation is available.",
        immediateUntilLabel: "Available until",
    },
} as LicenseContent
const errors = { subscriptionCancel: "Cancellation failed", subscriptionResume: "Resume failed" } as ErrorsContent

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    updates.length = 0
    navigation.length = 0
})

function show(available: boolean, cancelAt?: string, subscriptionStatus?: LicenseDashboardLicense["subscriptionStatus"]) {
    license = {
        id: "gid://crater/Subscription/2",
        subscriptionId: "gid://crater/Subscription/2",
        customerId: "gid://crater/Customer/1",
        customerName: "Customer",
        name: "Pro",
        startDate: "2026-01-01T00:00:00Z",
        immediateCancellationAvailable: available,
        immediateCancellationUntil: "2026-10-15T12:00:00Z",
        cancelAt,
        subscriptionStatus,
    }
    render(<LicenseCancelDialog content={content} errors={errors} customerId="1" licenseId="2" locale="en" />)
}

test("offers immediate cancellation from Crater availability and submits its flag", async () => {
    let request: unknown
    globalThis.fetch = (async (_input, options) => {
        request = JSON.parse(String(options?.body))
        return new Response(JSON.stringify({ status: "CANCELED", immediateCancellationAvailable: false, immediateCancellationUntil: license.immediateCancellationUntil }))
    }) as typeof fetch
    show(true)
    assert.ok(screen.getByText("Oct 15, 2026"))
    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))
    await waitFor(() => assert.equal(updates.length, 1))
    assert.deepEqual(request, { id: license.subscriptionId, immediately: true })
    assert.equal((updates[0] as LicenseDashboardLicense).immediateCancellationAvailable, false)
    assert.equal((updates[0] as LicenseDashboardLicense).subscriptionStatus, "CANCELED")
    assert.equal(navigation[0], "/en/licenses/customer/1/license/2")
})

test("keeps period-end cancellation when Crater refuses immediate cancellation", async () => {
    let request: unknown
    globalThis.fetch = (async (_input, options) => {
        request = JSON.parse(String(options?.body))
        return new Response(JSON.stringify({ status: "ACTIVE", cancelAt: "2026-11-01T00:00:00Z", immediateCancellationAvailable: false }))
    }) as typeof fetch
    show(false)
    assert.equal(screen.queryByRole("button", { name: "Cancel immediately" }), null)
    fireEvent.click(screen.getByRole("button", { name: "Cancel at period end" }))
    await waitFor(() => assert.equal(updates.length, 1))
    assert.deepEqual(request, { id: license.subscriptionId })
    assert.equal((updates[0] as LicenseDashboardLicense).cancelAt, "2026-11-01T00:00:00Z")
})

test("a pending cancellation can still be canceled immediately or resumed", () => {
    show(true, "2026-11-01T00:00:00Z")
    assert.ok(screen.getByRole("button", { name: "Cancel immediately" }))
    assert.ok(screen.getByRole("button", { name: "Keep my subscription" }))
    assert.equal(screen.queryByRole("button", { name: "Cancel at period end" }), null)
})

test("a terminal subscription cannot be canceled again or resumed", () => {
    show(false, "2026-10-10T00:00:00Z", "CANCELED")
    assert.equal(screen.queryByRole("button", { name: "Cancel immediately" }), null)
    assert.equal(screen.queryByRole("button", { name: "Keep my subscription" }), null)
    assert.equal(screen.queryByRole("button", { name: "Cancel at period end" }), null)
    assert.ok(screen.getByRole("button", { name: "Close" }))
})

test("keeps cancellation failures visible without updating local state", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 422 })) as typeof fetch
    show(true)
    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))
    await waitFor(() => assert.equal(screen.getByRole("alert").textContent, "Cancellation failed"))
    assert.equal(updates.length, 0)
    assert.equal(navigation.length, 0)
})
