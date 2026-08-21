import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
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
    buttonLabel: "Upgrade",
    text: "Switch to {plan}",
} as CheckoutData["upgradeBanner"]

const subscriptionConfig = {
    packages: {
        custom: { title: "Custom" },
        max: { title: "Max" },
        pro: { title: "Pro" },
    },
} as SubscriptionConfigData

afterEach(cleanup)

test("offers only the upgrade from pro to max", async () => {
    const onUpgrade = mock.fn()
    render(<UpgradePlanBanner content={content} currentPlan="pro" onUpgrade={onUpgrade} subscriptionConfig={subscriptionConfig} />)

    assert.match(screen.getByText(/Switch to/).textContent ?? "", /Max/)
    await userEvent.setup().click(screen.getByRole("button", { name: "Upgrade" }))
    assert.deepEqual(onUpgrade.mock.calls[0]?.arguments, ["max"])
})

for (const currentPlan of ["max", "custom", undefined]) {
    test(`does not offer an upgrade for ${currentPlan ?? "a missing plan"}`, () => {
        const { container } = render(<UpgradePlanBanner content={content} currentPlan={currentPlan} onUpgrade={() => undefined} subscriptionConfig={subscriptionConfig} />)

        assert.equal(container.textContent, "")
    })
}
