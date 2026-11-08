import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

let stage = "billingAddress"
let formState: { checkoutSession: { clientSecret: string } | null; stripeCheckoutReady: boolean } | null = null
let segmentedControlProps: { disabled?: boolean } | null = null
let pricingOverviewProps: { taxStatus?: string } | null = null
const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>

mock.module("next/navigation", {
    namedExports: {
        useParams: () => ({ locale: "en" }),
        usePathname: () => "/en/checkout",
        useRouter: () => ({ replace: () => {} }),
        useSearchParams: () => new URLSearchParams({ plan: "pro", customerType: "b2c", deploymentType: "self_hosted", paymentPeriod: "monthly" }),
    },
})
mock.module("@/components/checkout/state/CheckoutStageProvider", {
    namedExports: { useCheckoutStage: () => ({ stage, setStage: () => {}, hasError: false, setHasError: () => {} }) },
})
mock.module("@/components/checkout/form/CheckoutFormProvider", {
    namedExports: { useOptionalCheckoutFormState: () => formState },
})
mock.module("@/components/checkout/session/CraterSessionProvider", {
    namedExports: { useCraterSession: () => ({ authenticated: true, error: null, isLoading: false }) },
})
mock.module("@/components/checkout/summary/CheckoutPricingOverview", {
    namedExports: {
        CheckoutPricingOverview: (props: { taxStatus?: string }) => {
            pricingOverviewProps = props
            return null
        },
    },
})
const calculator = await import("@/lib/subscription/calculator")
mock.module("@/lib/subscription/calculator", {
    namedExports: {
        ...calculator,
        resolveCheckoutPricing: () => ({
            aiTokens: 0,
            paymentPeriod: "monthly",
            plan: "pro",
            planTitle: "Pro",
            pricing: { totalBeforeDiscount: 15, totalPrice: 15 },
            workflowExecutions: 0,
        }),
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Alert: Passthrough,
        AutoScrollArea: Passthrough,
        Badge: Passthrough,
        Button: Passthrough,
        Card: Passthrough,
        Dialog: Passthrough,
        DialogClose: Passthrough,
        DialogContent: Passthrough,
        DialogDescription: Passthrough,
        DialogOverlay: Passthrough,
        DialogPortal: Passthrough,
        DialogTitle: Passthrough,
        DialogTrigger: Passthrough,
        ScrollArea: Passthrough,
        ScrollAreaScrollbar: Passthrough,
        ScrollAreaThumb: Passthrough,
        ScrollAreaViewport: Passthrough,
        SegmentedControl: (props: { disabled?: boolean; children?: React.ReactNode }) => {
            segmentedControlProps = props
            return <div data-testid="payment-period-control">{props.children}</div>
        },
        SegmentedControlItem: Passthrough,
        TextInput: Passthrough,
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const { CheckoutSummary } = await import("../../src/components/checkout/summary/CheckoutSummary")

const content = {
    eyebrow: "Order summary",
    heading: "Your plan: {plan}",
    description: "Review your plan",
    nextChargeText: "Next charge on {date}",
    pricing: { perMonthSuffix: "/ month", discountButtonLabel: "Apply" },
} as CheckoutData["summary"]
const subscriptionConfig = {
    plan: { pro: { title: "Pro", description: "Pro plan" }, max: { title: "Max" }, custom: { title: "Custom" } },
    paymentPeriod: { label: "Payment period", monthlyText: "Monthly", quarterlyText: "Quarterly", yearlyText: "Yearly", monthlyPeriodSuffix: "/ month" },
    deployment: { cloud: { title: "Cloud" }, selfHosted: { title: "Self-hosted" } },
    customerType: { b2b: { title: "Business" }, b2c: { title: "Personal" } },
} as unknown as SubscriptionConfigData
const checkoutPackages = { planQuantities: { pro: { aiTokens: 0, workflowExecutions: 0 }, max: { aiTokens: 0, workflowExecutions: 0 } } } as CheckoutPackages

function renderSummary(props: Partial<React.ComponentProps<typeof CheckoutSummary>> = {}) {
    return render(<CheckoutSummary checkoutPackages={checkoutPackages} content={content} subscriptionConfig={subscriptionConfig} subscriptionPrices={{} as SubscriptionPriceCatalog} {...props} />)
}

afterEach(() => {
    cleanup()
    stage = "billingAddress"
    formState = null
    segmentedControlProps = null
    pricingOverviewProps = null
})

test("keeps the payment period control in place but disabled during payment", () => {
    renderSummary()
    assert.ok(screen.getByTestId("payment-period-control"))
    assert.equal(segmentedControlProps?.disabled, false)

    cleanup()
    stage = "payment"
    renderSummary()
    assert.ok(screen.getByTestId("payment-period-control"))
    assert.equal(segmentedControlProps?.disabled, true)
})

test("marks the tax as loading only while Stripe is still loading the checkout session", () => {
    formState = { checkoutSession: { clientSecret: "cs_test" }, stripeCheckoutReady: false }
    renderSummary()
    assert.equal(pricingOverviewProps?.taxStatus, "loading")

    cleanup()
    formState = { checkoutSession: { clientSecret: "cs_test" }, stripeCheckoutReady: true }
    renderSummary()
    assert.equal(pricingOverviewProps?.taxStatus, "unknown")

    cleanup()
    formState = null
    renderSummary()
    assert.equal(pricingOverviewProps?.taxStatus, "unknown")
})

test("reports the tax as ready once Stripe pricing or a tax quote is available", () => {
    formState = { checkoutSession: { clientSecret: "cs_test" }, stripeCheckoutReady: false }
    renderSummary({ taxQuote: { amountTotal: 1_785, taxAmountExclusive: 285 } as React.ComponentProps<typeof CheckoutSummary>["taxQuote"] })
    assert.equal(pricingOverviewProps?.taxStatus, "ready")
})
