import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

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
const { CheckoutPricingOverview } = await import("../../src/components/checkout/summary/CheckoutPricingOverview")

const content = {
    eyebrow: "Order summary",
    heading: "Review your configuration",
    description: "Your selected configuration",
    deploymentIcons: { cloud: "cloud", selfHosted: "server" },
    deploymentIconColor: "aqua",
    customerTypeIcons: { b2b: "building", b2c: "user" },
    customerTypeIconColor: "blue",
    pricing: {
        planLabel: "Plan",
        baseLabel: "AI tokens",
        workflowExecutionsLabel: "Workflow executions",
        quarterlyDiscountLabel: "Quarterly discount",
        yearlyDiscountLabel: "Yearly discount",
        discountInputPlaceholder: "Code",
        discountButtonLabel: "Apply",
        discountPromptLabel: "Add discount",
        discountRemoveLabel: "Remove",
        taxLabel: "Tax",
        taxInclusiveLabel: "Included tax",
        taxExclusiveLabel: "Additional tax",
        subtotalLabel: "Subtotal",
        totalExcludingTaxLabel: "Total excluding tax",
        taxRateLabel: "{rate} on {amount}",
        totalDueTodayLabel: "Total due today",
        totalIncludingTaxSuffix: "incl. VAT",
        totalLabel: "Total",
        perMonthSuffix: "/ month",
    },
} as CheckoutData["summary"]

const subscriptionConfig = {
    plan: {
        pro: { title: "Pro", color: "yellow" },
        max: { title: "Max", color: "aqua" },
        custom: { title: "Custom", color: "magenta" },
    },
} as SubscriptionConfigData

afterEach(cleanup)

const previewProps = {
    aiTokens: 0,
    content,
    lineItemAmount: 100,
    lineItemLabel: "Pro (Cloud, B2C)",
    locale: "en" as const,
    periodEnd: new Date(2027, 1, 7),
    periodStart: new Date(2026, 10, 7),
    planTitle: "Pro",
    subtotalPrice: 100,
    subscriptionConfig,
    workflowExecutions: 0,
}

test("shows included tax without a misleading zero additional-tax row", () => {
    const { container } = render(<CheckoutPricingOverview {...previewProps} taxAmount={0} taxPercentage={0} taxAmountInclusive={19} taxPercentageInclusive={0.19} totalPrice={119} />)

    assert.match(container.textContent ?? "", /Included tax \(19% on €100\.00\)€19\.00/)
    assert.doesNotMatch(container.textContent ?? "", /Additional tax|Tax \(0%/)
    assert.equal(container.querySelector('[data-testid="total-price"]')?.textContent, "119")
})

test("shows both included and additional tax for mixed prices", () => {
    const { container } = render(<CheckoutPricingOverview {...previewProps} taxAmount={10} taxPercentage={null} taxAmountInclusive={19} taxPercentageInclusive={null} totalPrice={129} />)

    assert.match(container.textContent ?? "", /Included tax€19\.00/)
    assert.match(container.textContent ?? "", /Additional tax€10\.00/)
    assert.equal(container.querySelector('[data-testid="total-price"]')?.textContent, "129")
})

test("keeps a zero tax amount visible", () => {
    const { container } = render(<CheckoutPricingOverview {...previewProps} taxAmount={0} taxPercentage={0} taxAmountInclusive={0} taxPercentageInclusive={0} totalPrice={100} />)

    assert.match(container.textContent ?? "", /Tax \(0% on €100\.00\)€0\.00/)
    assert.doesNotMatch(container.textContent ?? "", /Included tax|Additional tax|incl\. VAT/)
})

test("renders plan, usage tiles, the line item with its period and the totals", () => {
    const { container } = render(
        <CheckoutPricingOverview
            {...previewProps}
            aiTokens={4_000_000}
            billingCountry="DE"
            lineItemAmount={65.67}
            lineItemLabel="Max (Cloud, Business)"
            planDescription="A ready-to-use plan for organizations with higher requirements."
            planTitle="Max"
            subtotalPrice={65.67}
            taxAmount={12.48}
            taxLines={[{ amount: 12.48, displayName: "VAT", inclusive: false, percentage: 19 }]}
            taxPercentage={0.19}
            totalPrice={78.15}
            workflowExecutions={25_000}
        />
    )
    const text = container.textContent ?? ""

    assert.match(text, /^MaxA ready-to-use plan for organizations with higher requirements\./)
    assert.match(text, /AI tokens4M/)
    assert.match(text, /Workflow executions25K/)
    assert.match(text, /Max \(Cloud, Business\)7 Nov 2026 — 7 Feb 2027€65\.67/)
    assert.match(text, /Subtotal€65\.67/)
    assert.match(text, /Total excluding tax€65\.67/)
    assert.match(text, /VAT – Germany \(19% on €65\.67\)€12\.48/)
    assert.match(text, /Total due today78\.15incl\. VAT/)
    assert.ok(container.querySelector("#checkout-applied-discount"))
})

test("shows the purchased plan as a badge instead of a price line after checkout", () => {
    const { container, getByText } = render(
        <CheckoutPricingOverview
            confirmedPricing={{
                aiTokens: null,
                currency: "eur",
                customerType: "b2b",
                deployment: "cloud",
                discountAmount: 0,
                periodSuffix: "/ month",
                plan: "pro",
                taxAmount: 18.81,
                totalPrice: 117.81,
                workflowExecutions: null,
            }}
            content={content}
            locale="en"
            subscriptionConfig={subscriptionConfig}
        />
    )

    const badges = container.querySelector("span.flex-wrap")
    assert.equal(badges?.firstElementChild?.textContent, "Pro")
    assert.ok(badges?.firstElementChild?.className.includes("text-yellow!"))
    assert.ok(getByText("Pro"))
    assert.doesNotMatch(container.textContent ?? "", /Plan€/)
    assert.match(container.textContent ?? "", /Tax€18\.81/)
})
