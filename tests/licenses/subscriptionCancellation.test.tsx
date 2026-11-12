import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ReactNode, type ButtonHTMLAttributes } from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import { licenseToastContent } from "../helpers/licenseToasts"
import type { LicenseDashboardLicense } from "../../src/lib/licenses/types"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "../../src/lib/cms"

installDomTestEnvironment()
let license: LicenseDashboardLicense
const updates: unknown[] = []
const notifications: Array<{ title: string; color: string; children?: string }> = []
const closes: string[] = []
const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>
// Selecting an option has to reach the select's onValueChange, so the items render as clickable options.
const SelectContext = React.createContext<((value: string) => void) | undefined>(undefined)
mock.module("@code0-tech/pictor", {
    namedExports: {
        Alert: ({ children, color, ...props }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => <div role={color === "error" ? "alert" : "status"} aria-live={color === "error" ? "assertive" : "polite"} {...props}>{children}</div>,
        toast: (value: typeof notifications[number]) => { notifications.push(value); return "test-toast" },
        Button: ({ children, variant, paddingSize, color, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; paddingSize?: string; color?: string }) => <button data-variant={variant} data-padding={paddingSize} data-color={color} {...props}>{children}</button>,
        Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
        Flex: passthrough,
        Text: ({ children, role }: { children?: ReactNode; role?: string }) => <span role={role}>{children}</span>,
        SelectInput: ({ children, onValueChange }: { children?: ReactNode; onValueChange?: (value: string) => void }) => <SelectContext.Provider value={onValueChange}><div>{children}</div></SelectContext.Provider>,
        SelectTrigger: passthrough,
        SelectValue: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
        SelectPortal: passthrough,
        SelectContent: passthrough,
        SelectViewport: passthrough,
        SelectItem: function SelectItem({ children, value }: { children?: ReactNode; value: string }) {
            const onValueChange = React.useContext(SelectContext)
            return <div role="option" aria-selected={false} onClick={() => onValueChange?.(value)}>{children}</div>
        },
        SelectItemText: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
    },
})
mock.module("@code0-tech/pictor/dist/components/card/CardSection", { defaultExport: passthrough })
mock.module("@/components/licenses/data/LicenseDataProvider", {
    namedExports: { useLicenseData: () => ({ licenses: [license], updateLicense: (_id: string, values: unknown) => updates.push(values) }) },
})
mock.module("@/hooks/useSubscriptionUpdatePreview", { namedExports: { useSubscriptionUpdatePreview: () => ({}) } })
mock.module("@/components/licenses/dialog/shared/LicenseTabLayout", {
    namedExports: {
        LicenseTabHeader: ({ title, description }: { title: ReactNode; description: ReactNode }) => <header><h2>{title}</h2><p>{description}</p></header>,
        LicenseTabSection: ({ children, title }: { children: ReactNode; title?: ReactNode }) => <section>{title ? <h3>{title}</h3> : null}{children}</section>,
        LicenseTabRow: ({ title, description, action, children }: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children?: ReactNode }) => <div><span>{title}</span><span>{description}</span>{action}{children}</div>,
        LicenseTabAlert: ({ children }: { children: ReactNode }) => <p role="alert">{children}</p>,
    },
})
const { render, cleanup, screen, fireEvent, waitFor } = await import("@testing-library/react")
const { LicenseGeneralTab } = await import("../../src/components/licenses/dialog/subscription/LicenseGeneralTab")
const { LicenseToastsProvider } = await import("../../src/components/licenses/layout/LicenseNotifications")
const wrapper = ({ children }: { children: ReactNode }) => <LicenseToastsProvider locale="en" toasts={licenseToastContent}>{children}</LicenseToastsProvider>
const originalFetch = globalThis.fetch
const content = {
    license: "License",
    values: {
        unknown: "Unknown",
        customerTypes: { personal: "Personal", business: "Business" },
        deploymentTypes: { cloud: "Cloud", selfHosted: "Self hosted" },
        invoiceStatuses: { draft: "Draft", open: "Open", paid: "Paid", uncollectible: "Uncollectible", void: "Void" },
        paymentPeriods: { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" },
        plans: { pro: "Pro", max: "Max", custom: "Custom" },
        statuses: { active: "Active", pending: "Pending", incomplete: "Incomplete", incompleteExpired: "Expired", pastDue: "Past due", paused: "Paused", trialing: "Trialing", unpaid: "Unpaid", canceled: "Canceled" },
    },
    dashboard: { statusLabel: "Status" },
    invoices: { unavailableLabel: "Unavailable" },
    subscriptionPreview: { totalLabel: "New total", loadingLabel: "Calculating…" },
    billing: {
        heading: "Billing",
        description: "Change how often you are billed.",
        statusDescription: "The current state of this subscription.",
        periodLabel: "Billing period",
        currentPeriodEndLabel: "Current period ends",
        currentPeriodEndDescription: "Renews on {date}.",
        currentPeriodEndPendingDescription: "Switches to {selection} on {date}.",
        currentPeriodEndCanceledDescription: "Access ends on {date}.",
        currentPeriodEndUnknownDescription: "No renewal scheduled.",
    },
    editor: { closeLabel: "Close", cancellationHeading: "Cancellation", licenseEditDescription: "Manage the license.", paymentMethodTabLabel: "Payment method", paymentMethodDescription: "Manage the payment method." },
    cancel: {
        confirmLabel: "Cancel at period end",
        resumeLabel: "Keep my subscription",
        immediateConfirmLabel: "Cancel immediately",
        immediateDescription: "Immediate cancellation is available.",
        immediateUntilLabel: "Available until",
        immediateConfirmHeading: "Cancel your subscription immediately?",
        immediateConfirmDescription: "Your subscription ends right now and cannot be resumed.",
        immediateConfirmSubmitLabel: "Yes, cancel immediately",
        immediateConfirmBackLabel: "Go back",
        description: "Cancellation takes effect at the end of your billing period.",
        pendingHeading: "Your subscription is set to cancel",
        pendingDescription: "The subscription ends on the date below.",
        cancelAtLabel: "Subscription ends",
        extraordinaryLabel: "Terminate for cause",
        extraordinaryDescription: "We review your request within three business days.",
        extraordinaryReasonPlaceholder: "Select a reason",
        extraordinarySubmitLabel: "Submit termination request",
        extraordinaryRequestedDescription: "Your request is being reviewed.",
        extraordinaryReasons: {
            ProlongedOutage: "Prolonged outage",
            UnresolvedMaterialDefect: "Unresolved defect",
            CoreFeatureRemoved: "Core feature removed",
            DataBreachByProvider: "Data breach",
            BreachOfContractualCommitment: "Breach of contract",
            DpaViolation: "DPA violation",
            UnjustifiedSuspension: "Unjustified suspension",
            Other: "Other good cause",
        },
    },
} as unknown as LicenseContent
const errors = { subscriptionCancel: "Cancellation failed", subscriptionResume: "Resume failed", extraordinaryTermination: "Termination request failed" } as ErrorsContent
const subscriptionConfig = { paymentPeriod: { monthlyText: "Monthly", quarterlyText: "Quarterly", yearlyText: "Yearly" } } as unknown as SubscriptionConfigData

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    updates.length = 0
    closes.length = 0
    notifications.length = 0
})

function show(available: boolean, cancelAt?: string, subscriptionStatus?: LicenseDashboardLicense["subscriptionStatus"]) {
    license = {
        id: "gid://crater/Subscription/2",
        subscriptionId: "gid://crater/Subscription/2",
        customerId: "gid://crater/Customer/1",
        customerName: "Customer",
        name: "Pro",
        startDate: "2026-01-01T00:00:00Z",
        paymentPeriod: "monthly",
        subscriptionStatus: subscriptionStatus ?? "ACTIVE",
        immediateCancellationAvailable: available,
        immediateCancellationUntil: "2026-10-15T12:00:00Z",
        cancelAt,
    } as LicenseDashboardLicense
    render(
        <LicenseGeneralTab
            content={content}
            errors={errors}
            license={license}
            locale="en"
            namespaceHref="https://app.example/login"
            onClose={() => closes.push("close")}
            subscriptionConfig={subscriptionConfig}
            title="General"
        />,
        { wrapper }
    )
}

test("offers immediate cancellation from Crater availability and submits its flag", async () => {
    let request: unknown
    globalThis.fetch = (async (_input, options) => {
        request = JSON.parse(String(options?.body))
        return new Response(JSON.stringify({ status: "CANCELED", immediateCancellationAvailable: false, immediateCancellationUntil: license.immediateCancellationUntil }))
    }) as typeof fetch
    show(true)
    assert.ok(screen.getByText(`${content.cancel.immediateDescription} ${content.cancel.immediateUntilLabel}: Oct 15, 2026`))
    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel immediately" }))
    await waitFor(() => assert.equal(updates.length, 1))
    assert.deepEqual(request, { id: license.subscriptionId, immediately: true })
    assert.equal((updates[0] as LicenseDashboardLicense).immediateCancellationAvailable, false)
    assert.equal((updates[0] as LicenseDashboardLicense).subscriptionStatus, "CANCELED")
    assert.equal(notifications[0].title, "Subscription canceled")
})

test("asks for confirmation with the consequences before cancelling immediately", () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return new Response("{}")
    }) as typeof fetch
    show(true)

    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))

    assert.equal(requests, 0)
    assert.ok(screen.getByText(content.cancel.immediateConfirmDescription))
    assert.equal(screen.getByRole("button", { name: "Yes, cancel immediately" }).getAttribute("data-color"), "error")
    assert.equal(screen.queryByRole("button", { name: "Cancel immediately" }), null)
})

test("asks for confirmation before cancelling at the end of the period", () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return new Response("{}")
    }) as typeof fetch
    show(false)

    fireEvent.click(screen.getByRole("button", { name: "Cancel at period end" }))

    assert.equal(requests, 0)
    const confirm = screen.getByRole("button", { name: "Cancel at period end" })
    assert.equal(confirm.getAttribute("data-color"), "error")
    assert.ok(screen.getByRole("button", { name: "Go back" }))
})

test("going back from the confirmation cancels nothing", () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return new Response("{}")
    }) as typeof fetch
    show(true)

    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))
    fireEvent.click(screen.getByRole("button", { name: "Go back" }))

    assert.equal(requests, 0)
    assert.equal(screen.queryByText(content.cancel.immediateConfirmDescription), null)
    assert.ok(screen.getByRole("button", { name: "Cancel immediately" }))
    assert.equal(updates.length, 0)
})

test("cancellation lives in the general screen instead of a dialog of its own", () => {
    show(true)
    assert.ok(screen.getByRole("heading", { level: 3, name: "Cancellation" }))
    assert.ok(screen.getByText(content.cancel.description))
    for (const name of ["Cancel immediately", "Cancel at period end"]) {
        const button = screen.getByRole("button", { name })
        assert.equal(button.getAttribute("data-variant"), "normal")
        assert.equal(button.getAttribute("data-padding"), "xxs")
        assert.equal(button.getAttribute("data-color"), "tertiary")
    }
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
    fireEvent.click(screen.getByRole("button", { name: "Cancel at period end" }))
    await waitFor(() => assert.equal(updates.length, 1))
    assert.deepEqual(request, { id: license.subscriptionId })
    assert.equal((updates[0] as LicenseDashboardLicense).cancelAt, "2026-11-01T00:00:00Z")
    assert.deepEqual(notifications[0], { title: "Cancellation scheduled", color: "success", children: "Access ends on Nov 1, 2026." })
})

test("a pending cancellation can still be canceled immediately or resumed", () => {
    show(true, "2026-11-01T00:00:00Z")
    assert.ok(screen.getByText(content.cancel.pendingHeading))
    assert.ok(screen.getByText("Nov 1, 2026"))
    assert.ok(screen.getByRole("button", { name: "Cancel immediately" }))
    assert.ok(screen.getByRole("button", { name: "Keep my subscription" }))
    assert.equal(screen.queryByRole("button", { name: "Cancel at period end" }), null)
})

test("a terminal subscription cannot be canceled again or resumed", () => {
    show(false, "2026-10-10T00:00:00Z", "CANCELED")
    assert.equal(screen.queryByText("Cancellation"), null)
    assert.equal(screen.queryByRole("button", { name: "Cancel immediately" }), null)
    assert.equal(screen.queryByRole("button", { name: "Keep my subscription" }), null)
    assert.equal(screen.queryByRole("button", { name: "Cancel at period end" }), null)
})

test("resuming a pending cancellation clears its dates", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ status: "ACTIVE", immediateCancellationAvailable: true }))) as typeof fetch
    show(true, "2026-11-01T00:00:00Z")
    fireEvent.click(screen.getByRole("button", { name: "Keep my subscription" }))
    await waitFor(() => assert.equal(updates.length, 1))
    assert.equal((updates[0] as LicenseDashboardLicense).cancelAt, null)
    assert.equal((updates[0] as LicenseDashboardLicense).canceledAt, null)
    assert.equal(notifications[0].title, "Cancellation withdrawn")
})

test("reports cancellation failures only through a toast without updating local state", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 422 })) as typeof fetch
    show(true)
    fireEvent.click(screen.getByRole("button", { name: "Cancel immediately" }))
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel immediately" }))
    await waitFor(() => assert.equal(notifications.length, 1))
    assert.equal(screen.queryByRole("alert"), null)
    assert.equal(screen.queryByText("Cancellation failed"), null)
    assert.equal(updates.length, 0)
    assert.equal(closes.length, 0)
    assert.deepEqual(notifications, [{ title: licenseToastContent.errorTitle, color: "error", children: "Cancellation failed" }])
})

test("extraordinary termination is only offered after the withdrawal window", () => {
    show(true)
    assert.equal(screen.queryByRole("button", { name: "Terminate for cause" }), null)
    cleanup()
    show(false, undefined, "CANCELED")
    assert.equal(screen.queryByRole("button", { name: "Terminate for cause" }), null)
    cleanup()
    // A scheduled period-end cancellation can still be escalated to a reviewed termination.
    show(false, "2026-11-01T00:00:00Z")
    assert.ok(screen.getByRole("button", { name: "Terminate for cause" }))
})

test("an extraordinary termination needs a reason and sends its code without changing the subscription", async () => {
    const requests: Array<{ url: string; body: unknown }> = []
    globalThis.fetch = (async (input, options) => {
        requests.push({ url: String(input), body: JSON.parse(String(options?.body)) })
        return new Response(JSON.stringify({ status: "ACTIVE" }))
    }) as typeof fetch
    show(false)

    fireEvent.click(screen.getByRole("button", { name: "Terminate for cause" }))
    const submit = screen.getByRole("button", { name: "Submit termination request" })
    assert.equal(submit.getAttribute("data-color"), "error")
    assert.equal((submit as HTMLButtonElement).disabled, true)
    fireEvent.click(submit)
    assert.equal(requests.length, 0)

    fireEvent.click(screen.getByRole("option", { name: "DPA violation" }))
    fireEvent.click(screen.getByRole("button", { name: "Submit termination request" }))

    await waitFor(() => assert.equal(notifications.length, 1))
    assert.deepEqual(requests, [{ url: "/api/crater/subscriptions/extraordinary-termination", body: { id: license.subscriptionId, reason: "DpaViolation" } }])
    assert.equal(notifications[0].title, "Termination request received")
    assert.equal(updates.length, 0)
    assert.ok(screen.getByText(content.cancel.extraordinaryRequestedDescription))
    assert.equal(screen.queryByRole("button", { name: "Terminate for cause" }), null)
})

test("a refused extraordinary termination is reported and can be retried", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ errorCode: "INVALID_SUBSCRIPTION" }), { status: 422 })) as typeof fetch
    show(false)

    fireEvent.click(screen.getByRole("button", { name: "Terminate for cause" }))
    fireEvent.click(screen.getByRole("option", { name: "Other good cause" }))
    fireEvent.click(screen.getByRole("button", { name: "Submit termination request" }))

    await waitFor(() => assert.equal(notifications.length, 1))
    assert.deepEqual(notifications, [{ title: licenseToastContent.errorTitle, color: "error", children: "Termination request failed" }])
    assert.equal(screen.queryByText(content.cancel.extraordinaryRequestedDescription), null)
    assert.equal((screen.getByRole("button", { name: "Submit termination request" }) as HTMLButtonElement).disabled, false)
})
