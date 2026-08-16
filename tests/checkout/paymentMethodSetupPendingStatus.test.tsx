import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { LicenseContent } from "../../src/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment("https://code0.example/en/licenses")

mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Text: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    },
})
mock.module("@stripe/react-stripe-js", {
    namedExports: {
        Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        PaymentElement: () => null,
        useElements: () => null,
        useStripe: () => null,
    },
})
mock.module("@stripe/stripe-js", {
    namedExports: {
        loadStripe: () => null,
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const { PaymentMethodSetupPendingStatus } = await import("../../src/components/licenses/dialog/PaymentMethodSetupElement")
const originalFetch = globalThis.fetch

const content = {
    closeLabel: "Close",
    paymentMethodSuccess: "Payment method updated.",
    savingPaymentMethodLabel: "Waiting for confirmation…",
} as LicenseContent["editor"]
const errorMessage = "Could not update payment method."

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
})

test("keeps the payment method UI pending until Crater confirms webhook readiness", async () => {
    let successCalls = 0
    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ status: "pending" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })) as typeof fetch

    render(
        <PaymentMethodSetupPendingStatus
            content={content}
            customerId="gid://crater/Customer/7"
            errorMessage={errorMessage}
            onCancel={() => undefined}
            onSuccess={() => {
                successCalls += 1
            }}
            retryLabel="Try again"
            setupIntentId="seti_example"
        />
    )

    assert.ok(await screen.findByText(content.savingPaymentMethodLabel))
    assert.equal(screen.queryByText(content.paymentMethodSuccess), null)
    assert.equal(successCalls, 0)
})
