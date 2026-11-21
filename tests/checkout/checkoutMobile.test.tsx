import assert from "node:assert/strict"
import test, { afterEach, beforeEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

const domWindow = installDomTestEnvironment()

let hasError = false
let isDesktop = false
const pricing = { currency: "EUR", hasTax: true, planTitle: "Pro", totalPrice: 17.85 }

mock.module("@/components/checkout/state/CheckoutStageProvider", {
    namedExports: { useCheckoutStage: () => ({ stage: "billingAddress", setStage: () => {}, hasError, setHasError: () => {} }) },
})
mock.module("@/components/checkout/form/CheckoutFormProvider", {
    namedExports: { CheckoutFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, useOptionalCheckoutFormState: () => null },
})
mock.module("@/components/checkout/form/CheckoutForm", {
    namedExports: { CheckoutForm: () => <button type="button">Stripe form</button> },
})
mock.module("@/components/checkout/summary/CheckoutSummary", {
    namedExports: { CheckoutSummary: () => <section>Summary</section> },
})
mock.module("@/components/checkout/summary/useCheckoutPricing", {
    namedExports: { useCheckoutPricing: () => pricing },
})
mock.module("@/components/checkout/shared/CheckoutLegalFooter", {
    namedExports: { CheckoutLegalFooter: () => null },
})
mock.module("@number-flow/react", {
    defaultExport: ({ value }: { value: number }) => <span>{value.toFixed(2)}</span>,
})

const { act, cleanup, render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutPageContent } = await import("../../src/components/checkout/CheckoutPageContent")

const form = { closeLabel: "Close", continueLabel: "Continue to Payment" } as CheckoutData["form"]
const summary = { pricing: { totalDueTodayLabel: "Total due today", totalIncludingTaxSuffix: "incl. VAT" } } as CheckoutData["summary"]

function renderCheckout() {
    return render(
        <CheckoutPageContent
            checkoutPackages={{} as CheckoutPackages}
            currentYear={2026}
            errors={{} as ErrorsContent}
            form={form}
            locale="en"
            subscriptionPrices={{} as SubscriptionPriceCatalog}
            summary={summary}
        />
    )
}

beforeEach(() => {
    Object.defineProperty(domWindow, "matchMedia", {
        configurable: true,
        value: (query: string) => ({ matches: isDesktop, media: query, addEventListener: () => {}, removeEventListener: () => {} }),
    })
})

afterEach(() => {
    cleanup()
    hasError = false
    isDesktop = false
    document.documentElement.style.overflow = ""
})

test("shows the amount due in the mobile bar and opens the form as a focused, scroll-locked dialog", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    assert.ok(screen.getByText("Total due today"))
    assert.ok(screen.getByText("17.85"))
    assert.ok(screen.getByText("incl. VAT"))
    assert.equal(screen.queryByRole("dialog"), null)

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))

    const dialog = screen.getByRole("dialog", { name: "Pro" })
    assert.equal(dialog.getAttribute("aria-modal"), "true")
    assert.equal(document.activeElement, screen.getByRole("button", { name: "Close" }))
    assert.equal(document.documentElement.style.overflow, "hidden")
    assert.ok(screen.getByText("Summary").closest("[inert]"), "the page behind the sheet is inert")
})

test("closes the sheet with the close button and with Escape", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await user.click(screen.getByRole("button", { name: "Close" }))
    assert.equal(screen.queryByRole("dialog"), null)
    assert.equal(document.documentElement.style.overflow, "")

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    })
    assert.equal(screen.queryByRole("dialog"), null)
})

test("keeps the form mounted but inert while the sheet is closed", () => {
    renderCheckout()
    const formButton = screen.getByText("Stripe form")
    assert.ok(formButton.closest("[inert]"), "the closed sheet is inert")
})

test("opens the sheet on its own when the checkout fails, so the error is never hidden", () => {
    hasError = true
    renderCheckout()
    assert.ok(screen.getByRole("dialog"))
    assert.equal(screen.queryByText("Summary"), null)
})

test("renders the form inline without a dialog on desktop", () => {
    isDesktop = true
    renderCheckout()
    assert.equal(screen.queryByRole("dialog"), null)
    assert.equal(screen.getByText("Stripe form").closest("[inert]"), null)
})
