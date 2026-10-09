import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { LicenseContent } from "../../src/lib/cms"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/licenses")

mock.module("@code0-tech/pictor", {
    namedExports: {
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
        loadStripe: () => Promise.resolve({ retrieveSetupIntent: async () => ({ setupIntent: { status: "processing" } }) }),
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const { PaymentMethodSetupPendingStatus } = await import("../../src/components/licenses/dialog/customer/PaymentMethodSetupElement")
const { StripeProvider } = await import("../../src/components/providers/StripeProvider")

const content = {
    closeLabel: "Close",
    paymentMethodSuccess: "Payment method added successfully.",
    savingPaymentMethodLabel: "Waiting for confirmation…",
} as LicenseContent["editor"]
const errorMessage = "Could not update payment method."

afterEach(() => {
    cleanup()
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
        </StripeProvider>
    )

    assert.ok(await screen.findByText(content.savingPaymentMethodLabel))
    assert.equal(screen.queryByText(content.paymentMethodSuccess), null)
    assert.equal(successCalls, 0)
})
