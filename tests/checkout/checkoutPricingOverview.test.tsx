import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

mock.module("@/components/ui/IconRenderer", {
    namedExports: { getIcon: () => <span aria-hidden="true" /> },
})

mock.module("@number-flow/react", {
    defaultExport: ({ value }: { value: number }) => <span data-testid="total-price">{value}</span>,
})

mock.module("@code0-tech/pictor", {
    namedExports: {
        Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span>,
        Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
    },
})

const { cleanup, render } = await import("@testing-library/react")
const { CheckoutPricingOverview } = await import("../../src/components/checkout/CheckoutPricingOverview")

const content = {
    deploymentIcons: { cloud: "cloud", selfHosted: "server" },
    deploymentIconColor: "aqua",
    customerTypeIcons: { b2b: "building", b2c: "user" },
    customerTypeIconColor: "blue",
    aiTokensIcon: "sparkles",
    aiTokensIconColor: "brand",
    workflowExecutionsIcon: "workflow",
    workflowExecutionsIconColor: "lime",
    pricing: {
        label: "Pricing overview",
        description: "Your selected configuration",
        planLabel: "Plan",
        baseLabel: "AI tokens",
        workflowExecutionsLabel: "Workflow executions",
        quarterlyDiscountLabel: "Quarterly discount",
        yearlyDiscountLabel: "Yearly discount",
        discountLabel: "Discount",
        discountInputPlaceholder: "Code",
        discountButtonLabel: "Apply",
        discountPromptLabel: "Add discount",
        discountRemoveLabel: "Remove",
        taxLabel: "Tax",
        totalLabel: "Total",
        perMonthSuffix: "/ month",
    },
} as CheckoutData["summary"]

const subscriptionConfig = {
    plan: {
        pro: { color: "yellow", icon: "pro" },
        max: { color: "aqua", icon: "max" },
        custom: { color: "magenta", icon: "custom" },
    },
} as SubscriptionConfigData

afterEach(cleanup)

test("renders the checkout configuration and all applicable price rows", () => {
    const { container } = render(
        <CheckoutPricingOverview
            aiTokenPrice={83.33}
            aiTokens={500_000_000}
            content={content}
            customerType="b2b"
            deployment="self_hosted"
            isCustomPlan
            locale="en"
            monthlyPeriodSuffix="/ month"
            paymentPeriodDiscountAmount={20}
            paymentPeriodDiscountLabel="Quarterly discount"
            paymentPeriodDiscountPercentage={0.1}
            periodSuffix="/ quarter"
            planTitle="Custom"
            subscriptionConfig={subscriptionConfig}
            taxAmount={47.5}
            taxPercentage={0.19}
            totalPrice={297.5}
            workflowExecutionPrice={166.67}
            workflowExecutions={250_000}
        />
    )

    assert.match(container.textContent ?? "", /Custom/)
    assert.match(container.textContent ?? "", /500M \/ month/)
    assert.match(container.textContent ?? "", /250K \/ month/)
    assert.match(container.textContent ?? "", /Quarterly discount \(-10%\)/)
    assert.match(container.textContent ?? "", /Tax \(19%\)/)
    assert.equal(container.querySelector('[data-testid="total-price"]')?.textContent, "297.5")
    assert.ok(container.querySelector("#checkout-applied-discount"))
})
