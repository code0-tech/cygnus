import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ReactNode } from "react"
import type { ErrorsContent, LicenseContent } from "../../src/lib/cms"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment("https://example.com/en/licenses/customer/1/edit?tab=paymentMethods")

let confirmStatus = "succeeded"
let retrievedStatus = "processing"
let failCreate = false
let failConfirm = false
const succeeded = mock.fn()
const successToast = mock.fn((_key: string) => {})
const errorToast = mock.fn((_message: string) => {})
const retrieve = mock.fn(async () => ({ setupIntent: { status: retrievedStatus } }))
const stripe = {
    confirmSetup: async () => (failConfirm ? { error: { message: "Stripe error" } } : { setupIntent: { id: "seti_example", status: confirmStatus } }),
    retrieveSetupIntent: retrieve,
}
const stripePromise = Promise.resolve(stripe)
const elements = {}
const createSetup = mock.fn(async () => {
    if (failCreate) throw new Error("Setup unavailable")
    return "seti_example_secret_example"
})

mock.module("@/lib/licenses/client", { namedExports: { createPaymentMethodSetup: createSetup } })
mock.module("@/components/licenses/layout/LicenseNotifications", { namedExports: { useLicenseToasts: () => ({ success: successToast, error: errorToast }) } })
mock.module("@/components/providers/StripeProvider", { namedExports: { useStripePromise: () => stripePromise } })
mock.module("@/components/licenses/dialog/shared/LicenseDialog", {
    namedExports: {
        LicenseDialog: ({ open, tabs, onClose }: { open: boolean; tabs: { content: ReactNode }[]; onClose: () => void }) =>
            open ? (
                <section role="dialog">
                    {tabs[0].content}
                    <button onClick={onClose}>Close</button>
                </section>
            ) : null,
    },
})
mock.module("@/components/licenses/dialog/shared/LicenseTabLayout", {
    namedExports: {
        LicenseTabHeader: ({ title, action }: { title: string; action?: ReactNode }) => (
            <div>
                {title}
                {action}
            </div>
        ),
        LicenseTabSaveButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Alert: ({ children, color, ...props }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => <div role={color === "error" ? "alert" : "status"} aria-live={color === "error" ? "assertive" : "polite"} {...props}>{children}</div>,
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Spacing: () => null,
        Text: ({ children }: { children: ReactNode }) => <p>{children}</p>,
    },
})
mock.module("@stripe/react-stripe-js", {
    namedExports: {
        Elements: ({ children }: { children: ReactNode }) => <>{children}</>,
        PaymentElement: ({ onReady }: { onReady: () => void }) => <button onClick={onReady}>Ready</button>,
        useElements: () => elements,
        useStripe: () => stripe,
    },
})

const { cleanup, render, screen, fireEvent, waitFor } = await import("@testing-library/react")
const { PaymentMethodSetupDialog } = await import("../../src/components/licenses/dialog/customer/PaymentMethodSetupDialog")
const content = { editor: { addPaymentMethodLabel: "Add payment method", savePaymentMethodLabel: "Save", savingPaymentMethodLabel: "Waiting", paymentMethodSuccess: "Added" } } as LicenseContent
const errors = { paymentMethodUpdate: "Could not add payment method", retry: "Try again" } as ErrorsContent
const show = () =>
    render(
        <PaymentMethodSetupDialog
            content={content}
            errors={errors}
            owner={{ customerId: "customer-1" }}
            onSuccess={succeeded}
            triggerLabel="Add card"
            returnPath="/en/licenses/customer/1/edit?tab=paymentMethods"
        />
    )
const openForm = async () => {
    show()
    fireEvent.click(screen.getByRole("button", { name: "Add card" }))
    fireEvent.click(await screen.findByRole("button", { name: "Ready" }))
}

afterEach(() => {
    cleanup()
    confirmStatus = "succeeded"
    retrievedStatus = "processing"
    failCreate = false
    failConfirm = false
    for (const fn of [succeeded, successToast, errorToast, retrieve, createSetup]) fn.mock.resetCalls()
    window.history.replaceState(null, "", "/en/licenses/customer/1/edit?tab=paymentMethods")
})

test("closes immediately when confirmation succeeds without another status request", async () => {
    await openForm()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => assert.ok(!screen.queryByRole("dialog")))
    assert.equal(succeeded.mock.callCount(), 1)
    assert.deepEqual(successToast.mock.calls[0].arguments, ["paymentConfirmed"])
    assert.equal(retrieve.mock.callCount(), 0)
    // Closing resets the form so another payment method can be added.
    fireEvent.click(screen.getByRole("button", { name: "Add card" }))
    await screen.findByRole("button", { name: "Ready" })
    assert.equal(createSetup.mock.callCount(), 2)
})

test("stays open while processing and closes once Stripe confirms success", async () => {
    confirmStatus = "processing"
    await openForm()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => assert.equal(retrieve.mock.callCount(), 1))
    assert.ok(screen.getByRole("dialog"))
    assert.equal(succeeded.mock.callCount(), 0)
    retrievedStatus = "succeeded"
    await waitFor(() => assert.ok(!screen.queryByRole("dialog")), { timeout: 2500 })
    assert.equal(succeeded.mock.callCount(), 1)
    assert.equal(successToast.mock.callCount(), 1)
})

test("confirmation errors appear only in the toast and allow another attempt", async () => {
    failConfirm = true
    await openForm()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => assert.equal(errorToast.mock.callCount(), 1))
    assert.equal(screen.queryByText(errors.paymentMethodUpdate), null)
    assert.ok(screen.getByRole("dialog"))
    failConfirm = false
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => assert.equal(succeeded.mock.callCount(), 1))
})

test("setup creation errors appear only in the toast and offer retry", async () => {
    failCreate = true
    show()
    fireEvent.click(screen.getByRole("button", { name: "Add card" }))
    await screen.findByRole("button", { name: errors.retry })
    assert.equal(errorToast.mock.callCount(), 1)
    assert.equal(screen.queryByText(errors.paymentMethodUpdate), null)
    failCreate = false
    fireEvent.click(screen.getByRole("button", { name: errors.retry }))
    await screen.findByRole("button", { name: "Ready" })
})

test("closes after confirming a payment method returned from Stripe", async () => {
    retrievedStatus = "succeeded"
    window.history.replaceState(null, "", "?tab=paymentMethods&setup_intent=seti_example&setup_intent_client_secret=seti_example_secret_example&redirect_status=succeeded")
    show()
    await waitFor(() => assert.equal(succeeded.mock.callCount(), 1))
    assert.ok(!screen.queryByRole("dialog"))
    assert.equal(createSetup.mock.callCount(), 0)
    assert.equal(new URL(window.location.href).searchParams.has("setup_intent_client_secret"), false)
})
