import assert from "node:assert/strict"
import test, { afterEach, beforeEach, mock } from "node:test"
import React, { createContext, useContext, useMemo, useState } from "react"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

const domWindow = installDomTestEnvironment()

type Stage = "billingAddress" | "payment"
let initialHasError = false
let isDesktop = false
const pricing = { currency: "EUR", hasTax: true, paymentPeriod: "monthly", periodOptions: [{ label: "Monthly", period: "monthly" }], planTitle: "Pro", totalPrice: 17.85 }

// A real (tiny) stage provider, so the form mock can move between billing and payment like the Stripe form does.
const StageContext = createContext<{ hasError: boolean; setHasError: (value: boolean) => void; setStage: (stage: Stage) => void; stage: Stage } | null>(null)
function TestStageProvider({ children }: { children: React.ReactNode }) {
    const [stage, setStage] = useState<Stage>("billingAddress")
    const [hasError, setHasError] = useState(initialHasError)
    const value = useMemo(() => ({ hasError, setHasError, setStage, stage }), [hasError, stage])
    return <StageContext.Provider value={value}>{children}</StageContext.Provider>
}
function useTestStage() {
    const context = useContext(StageContext)
    if (!context) throw new Error("missing stage provider")
    return context
}

mock.module("@/components/checkout/state/CheckoutStageProvider", {
    namedExports: { CheckoutStageProvider: TestStageProvider, useCheckoutStage: useTestStage },
})
mock.module("@/components/checkout/form/CheckoutFormProvider", {
    namedExports: { CheckoutFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, useOptionalCheckoutFormState: () => null },
})
mock.module("@/components/checkout/form/CheckoutForm", {
    namedExports: {
        CheckoutForm: () => {
            const { setStage, stage } = useTestStage()
            return stage === "billingAddress" ? (
                <button type="button" onClick={() => setStage("payment")}>
                    Billing step: continue
                </button>
            ) : (
                <button type="button" onClick={() => setStage("billingAddress")}>
                    Payment step: back to billing
                </button>
            )
        },
    },
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

const form = { backToBillingLabel: "Back to Billing", billingHeading: "Billing address", continueLabel: "Continue to Payment" } as CheckoutData["form"]
const summary = { eyebrow: "Order Summary", pricing: { totalDueTodayLabel: "Total due today", totalIncludingTaxSuffix: "incl. VAT" } } as CheckoutData["summary"]

/** Minimal session history: `back()` pops synchronously and fires popstate, like a browser back button press. */
let historyEntries: (object | null)[] = []
function installFakeHistory() {
    historyEntries = [null]
    Object.defineProperty(domWindow, "history", {
        configurable: true,
        value: {
            get state() {
                return historyEntries.at(-1)
            },
            pushState: (state: object | null) => historyEntries.push(state),
            back: () => {
                if (historyEntries.length < 2) return
                historyEntries.pop()
                domWindow.dispatchEvent(new domWindow.PopStateEvent("popstate", { state: historyEntries.at(-1) }))
            },
        },
    })
}

async function pressBrowserBack() {
    await act(async () => window.history.back())
}

function renderCheckout() {
    return render(
        <TestStageProvider>
            <CheckoutPageContent
                checkoutPackages={{} as CheckoutPackages}
                currentYear={2026}
                errors={{} as ErrorsContent}
                form={form}
                locale="en"
                subscriptionPrices={{} as SubscriptionPriceCatalog}
                summary={summary}
            />
        </TestStageProvider>
    )
}

const summaryHidden = () => Boolean(screen.queryByText("Summary")?.closest(".max-lg\\:hidden"))
const formInert = () => Boolean(screen.getByRole("button", { name: /step/, hidden: true }).closest("[inert]"))
const backButton = () => screen.queryByRole("button", { name: /^Order Summary/ })

beforeEach(() => {
    installFakeHistory()
    Object.defineProperty(domWindow, "scrollTo", { configurable: true, value: () => {} })
    Object.defineProperty(domWindow, "matchMedia", {
        configurable: true,
        value: (query: string) => ({ matches: isDesktop, media: query, addEventListener: () => {}, removeEventListener: () => {} }),
    })
})

afterEach(() => {
    cleanup()
    initialHasError = false
    isDesktop = false
})

test("starts on the summary with the amount due in the bar and the form loading invisibly behind it", () => {
    renderCheckout()
    assert.ok(screen.getByText("Total due today"))
    assert.ok(screen.getByText("17.85"))
    assert.ok(screen.getByText("incl. VAT"))
    assert.equal(summaryHidden(), false)
    assert.equal(formInert(), true)
    assert.equal(backButton(), null)
})

test("opens the form as its own view with a history entry and focus on the back button", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))

    assert.equal(summaryHidden(), true)
    assert.equal(formInert(), false)
    assert.equal(historyEntries.length, 2)
    assert.equal(document.activeElement, backButton())
    assert.match(backButton()!.textContent ?? "", /Pro · Monthly/)
    assert.ok(screen.getByText("€17.85"))
    assert.equal(screen.getAllByText("incl. VAT").length, 2, "bar and order card both show the tax hint")
})

test("returns to the summary with the back button and with the browser back button", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await user.click(backButton()!)
    assert.equal(summaryHidden(), false)
    assert.equal(historyEntries.length, 1)
    assert.equal(document.activeElement, screen.getByRole("button", { name: /Continue to Payment/ }))

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await pressBrowserBack()
    assert.equal(summaryHidden(), false)
    assert.equal(formInert(), true)
})

test("walks back from payment to billing before leaving the form", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await user.click(screen.getByRole("button", { name: "Billing step: continue" }))
    assert.equal(historyEntries.length, 3)

    await pressBrowserBack()
    assert.ok(screen.getByRole("button", { name: "Billing step: continue" }))
    assert.equal(summaryHidden(), true)

    await pressBrowserBack()
    assert.equal(summaryHidden(), false)
    assert.equal(historyEntries.length, 1)
})

test("points the order card back to the billing address during payment", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await user.click(screen.getByRole("button", { name: "Billing step: continue" }))
    assert.equal(backButton(), null)

    await user.click(screen.getByRole("button", { name: /^Billing address/ }))
    assert.ok(screen.getByRole("button", { name: "Billing step: continue" }))
    assert.equal(summaryHidden(), true)
    assert.ok(backButton(), "on the billing step the card leads back to the summary again")
})

test("drops the payment history entry when the form's own back link returns to billing", async () => {
    const user = userEvent.setup({ document })
    renderCheckout()

    await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
    await user.click(screen.getByRole("button", { name: "Billing step: continue" }))
    await user.click(screen.getByRole("button", { name: "Payment step: back to billing" }))

    assert.equal(historyEntries.length, 2)
    assert.ok(screen.getByRole("button", { name: "Billing step: continue" }))
    assert.equal(summaryHidden(), true, "the ignored popstate must not leave the form")

    await pressBrowserBack()
    assert.equal(summaryHidden(), false)
})

test("shows the form on its own when the checkout fails, so the error is never hidden", () => {
    initialHasError = true
    renderCheckout()
    assert.equal(screen.queryByText("Summary"), null)
    assert.equal(formInert(), false)
    assert.equal(historyEntries.length, 1)
})

test("keeps both columns on desktop without history entries or a back bar", async () => {
    isDesktop = true
    const user = userEvent.setup({ document })
    renderCheckout()

    assert.equal(formInert(), false)
    await user.click(screen.getByRole("button", { name: /Continue to Payment/, hidden: true }))
    assert.equal(historyEntries.length, 1)
    assert.equal(backButton(), null)
})
