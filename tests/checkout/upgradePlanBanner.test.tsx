import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import type { SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button onClick={onClick}>{children}</button>,
    },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { UpgradePlanBanner } = await import("../../src/components/checkout/UpgradePlanBanner")

const content = {
    pro: { buttonLabel: "Upgrade to {plan}", gradientFrom: "#11aa22", gradientTo: "#001122", text: "Switch to {plan}" },
    max: { buttonLabel: "Configure {plan}", gradientFrom: "#2233aa", gradientTo: "#001122", text: "Scale with {plan}" },
    custom: { buttonLabel: "Increase usage", gradientFrom: "#aa2299", gradientTo: "#001122", text: "More capacity for {plan}" },
} satisfies UpgradeBannerData

const subscriptionConfig = {
    packages: {
        custom: { title: "Custom" },
        max: { title: "Max" },
        pro: { title: "Pro" },
    },
} as SubscriptionConfigData

afterEach(cleanup)

test("offers the configured upgrade from pro to max", async () => {
    const onUpgrade = mock.fn()
    render(<UpgradePlanBanner content={content} currentPlan="pro" onUpgrade={onUpgrade} subscriptionConfig={subscriptionConfig} />)

    assert.match(screen.getByText(/Switch to/).textContent ?? "", /Max/)
    const button = screen.getByRole("button", { name: "Upgrade to Max" })
    assert.equal((button.querySelector("span") as HTMLElement | null)?.style.color ?? "", "")
    await userEvent.setup().click(button)
    assert.deepEqual(onUpgrade.mock.calls[0]?.arguments, ["max"])
})

test("offers the configured upgrade from max to custom", async () => {
    const onUpgrade = mock.fn()
    render(<UpgradePlanBanner content={content} currentPlan="max" onUpgrade={onUpgrade} showPlanSpecificActions subscriptionConfig={subscriptionConfig} />)

    assert.match(screen.getByText(/Scale with/).textContent ?? "", /Custom/)
    await userEvent.setup().click(screen.getByRole("button", { name: "Configure Custom" }))
    assert.deepEqual(onUpgrade.mock.calls[0]?.arguments, ["custom"])
})

test("offers max and custom actions only when enabled by the license dashboard", async () => {
    const onUpgrade = mock.fn()
    const { rerender } = render(<UpgradePlanBanner content={content} currentPlan="max" onUpgrade={onUpgrade} subscriptionConfig={subscriptionConfig} />)
    assert.equal(screen.queryByRole("button"), null)

    rerender(<UpgradePlanBanner content={content} currentPlan="custom" onUpgrade={onUpgrade} showPlanSpecificActions subscriptionConfig={subscriptionConfig} />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Increase usage" }))
    assert.deepEqual(onUpgrade.mock.calls[0]?.arguments, ["custom"])
})

test("uses the plan-specific CMS gradient", () => {
    const { container } = render(<UpgradePlanBanner content={content} currentPlan="pro" onUpgrade={() => undefined} subscriptionConfig={subscriptionConfig} />)
    assert.match((container.firstElementChild as HTMLElement).style.backgroundImage, /#11aa22/)
    assert.match((container.firstElementChild as HTMLElement).style.backgroundImage, /#001122/)
})

for (const currentPlan of [undefined, "unknown"]) {
    test(`does not offer an upgrade for ${currentPlan ?? "a missing plan"}`, () => {
        const { container } = render(<UpgradePlanBanner content={content} currentPlan={currentPlan} onUpgrade={() => undefined} subscriptionConfig={subscriptionConfig} />)

        assert.equal(container.textContent, "")
    })
}
