import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { LicenseContent } from "../../src/lib/cms"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import { licenseToastContent } from "../helpers/licenseToasts"

installDomTestEnvironment("https://code0.example/en/licenses")

let setupStatus = "processing"
const notifications: Array<{ title: string; color: string; children?: string }> = []

mock.module("@code0-tech/pictor", {
    namedExports: {
        toast: (value: typeof notifications[number]) => { notifications.push(value); return "test-toast" },
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Spacing: () => null,
        Text: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    },
})
mock.module("@code0-tech/pictor/dist/components/card/CardSection", {
    defaultExport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
})
mock.module("@stripe/react-stripe-js", {
    namedExports: {
        Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        PaymentElement: () => null,
        useElements: () => null,
        useStripe: () => null,
    },
})
mock.module("@stripe/stripe-js/pure", {
    namedExports: {
        loadStripe: () => Promise.resolve({ retrieveSetupIntent: async () => ({ setupIntent: { status: setupStatus } }) }),
    },
})

const { cleanup, render, screen, waitFor, fireEvent } = await import("@testing-library/react")
const { PaymentMethodSetupPendingStatus } = await import("../../src/components/licenses/dialog/customer/PaymentMethodSetupElement")
const { StripeProvider } = await import("../../src/components/providers/StripeProvider")
const { LicenseToastsProvider } = await import("../../src/components/licenses/layout/LicenseNotifications")
const wrapper = ({ children }: { children: React.ReactNode }) => <LicenseToastsProvider locale="en" toasts={licenseToastContent}>{children}</LicenseToastsProvider>

const content = {
    closeLabel: "Close",
    paymentMethodSuccess: "Payment method added successfully.",
    savingPaymentMethodLabel: "Waiting for confirmation…",
} as LicenseContent["editor"]
const errorMessage = "Could not update payment method."

afterEach(() => {
    cleanup()
    setupStatus = "processing"
    notifications.length = 0
})

test("keeps the payment method UI pending while Stripe reports processing", async () => {
    let successCalls = 0

    render(
        <StripeProvider publicKey="pk_test_example">
            <PaymentMethodSetupPendingStatus
                content={content}
                errorMessage={errorMessage}
                onSuccess={() => {
                    successCalls += 1
                }}
                retryLabel="Try again"
                clientSecret="seti_example_secret_example"
            />
        </StripeProvider>,
        { wrapper }
    )

    assert.ok(await screen.findByText(content.savingPaymentMethodLabel))
    assert.equal(screen.queryByText(content.paymentMethodSuccess), null)
    assert.equal(successCalls, 0)
    assert.deepEqual(notifications, [])
})

for (const status of ["succeeded", "canceled"] as const) {
    test(`payment setup emits the correct toast for ${status}`, async () => {
        setupStatus = status
        let successCalls = 0
        render(
            <React.StrictMode>
                <StripeProvider publicKey="pk_test_example">
                    <PaymentMethodSetupPendingStatus content={content} errorMessage={errorMessage}
                        onSuccess={() => { successCalls += 1 }} retryLabel="Try again" clientSecret="seti_example_secret_example" />
                </StripeProvider>
            </React.StrictMode>,
            { wrapper }
        )
        await waitFor(() => assert.equal(notifications.length, 1))
        if (status === "succeeded") assert.ok(screen.getByText(content.paymentMethodSuccess))
        else {
            assert.equal(screen.queryByText(errorMessage), null)
            assert.equal(screen.queryByRole("alert"), null)
            assert.ok(screen.getByRole("button", { name: "Try again" }))
        }
        assert.equal(successCalls, status === "succeeded" ? 1 : 0)
        assert.deepEqual(notifications, [{
            title: status === "succeeded" ? licenseToastContent.paymentConfirmed.title : licenseToastContent.errorTitle,
            color: status === "succeeded" ? "success" : "error",
            children: status === "succeeded" ? licenseToastContent.paymentConfirmed.description : errorMessage,
        }])
        if (status === "canceled") {
            setupStatus = "succeeded"
            fireEvent.click(screen.getByRole("button", { name: "Try again" }))
            await waitFor(() => assert.equal(successCalls, 1))
        }
    })
}
