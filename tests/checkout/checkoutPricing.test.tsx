import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

let formState: Record<string, unknown> | null = null

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/checkout",
        useRouter: () => ({ replace: () => {} }),
        useSearchParams: () => new URLSearchParams({ plan: "pro", customerType: "b2c", deploymentType: "self_hosted", paymentPeriod: "monthly" }),
    },
})
mock.module("@/components/checkout/form/CheckoutFormProvider", {
    namedExports: { useOptionalCheckoutFormState: () => formState },
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

const { cleanup, render } = await import("@testing-library/react")
const { useCheckoutPricing } = await import("../../src/components/checkout/summary/useCheckoutPricing")

const content = { nextChargeText: "Next charge on {date}", pricing: { perMonthSuffix: "/ month" } } as CheckoutData["summary"]
const subscriptionConfig = {
    plan: { pro: { title: "Pro", description: "Pro plan" } },
    paymentPeriod: { monthlyText: "Monthly", quarterlyText: "Quarterly", yearlyText: "Yearly", monthlyPeriodSuffix: "/ month" },
    deployment: { cloud: { title: "Cloud" }, selfHosted: { title: "Self-hosted" } },
    customerType: { b2b: { title: "Business" }, b2c: { title: "Personal" } },
} as unknown as SubscriptionConfigData
const checkoutPackages = { planQuantities: { pro: { aiTokens: 0, workflowExecutions: 0 } } } as unknown as CheckoutPackages

function readPricing(overrides: { content?: CheckoutData["summary"] | null } = {}) {
    let result: ReturnType<typeof useCheckoutPricing> | undefined
    function Probe() {
        result = useCheckoutPricing({ checkoutPackages, content: "content" in overrides ? overrides.content : content, locale: "en", subscriptionConfig, subscriptionPrices: {} as SubscriptionPriceCatalog })
        return null
    }
    render(<Probe />)
    return result
}

afterEach(() => {
    cleanup()
    formState = null
})

test("uses the configured plan price until Stripe or a tax quote refines it", () => {
    const pricing = readPricing()
    assert.equal(pricing?.totalPrice, 15)
    assert.equal(pricing?.hasTax, false)
    assert.equal(pricing?.overview.taxStatus, "unknown")
    assert.equal(pricing?.overview.lineItemLabel, "Pro (Self-hosted, Personal)")
})

test("adds the previewed exclusive tax from the tax quote", () => {
    formState = { checkoutSession: null, stripeCheckoutReady: false, taxQuote: { amountTotal: 1_785, taxAmountExclusive: 285 } }
    const pricing = readPricing()
    assert.equal(pricing?.overview.taxAmount, 2.85)
    assert.equal(pricing?.totalPrice, 17.85)
    assert.equal(pricing?.hasTax, true)
    assert.equal(pricing?.overview.taxStatus, "ready")
})

test("prefers Stripe's session pricing, including discounts, over the preview", () => {
    formState = {
        checkoutSession: { clientSecret: "cs_test" },
        stripeCheckoutReady: true,
        stripePricing: { billingCountry: "DE", currency: "eur", discountAmount: 3, subtotalPrice: 15, taxAmount: 2.28, taxAmountInclusive: 0, taxLines: [], totalPrice: 14.28 },
        taxQuote: { amountTotal: 1_785, taxAmountExclusive: 285 },
    }
    const pricing = readPricing()
    assert.equal(pricing?.totalPrice, 14.28)
    assert.equal(pricing?.currency, "eur")
    assert.equal(pricing?.discountAmount, 3)
    assert.equal(pricing?.overview.billingCountry, "DE")
})

test("returns null while the summary content is missing", () => {
    assert.equal(readPricing({ content: null }), null)
})
