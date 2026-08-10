import assert from "node:assert/strict"
import test, { mock } from "node:test"
import React, { useEffect } from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/checkout",
        useSearchParams: () => new URLSearchParams({ configurationUrl: "/en/subscription" }),
    },
})

mock.module("next/link", {
    defaultExport: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
})

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutStageProvider, CheckoutStepper, useCheckoutStage } = await import("../../src/components/checkout/CheckoutStepper")

function StartAtPayment() {
    const { setStage } = useCheckoutStage()
    useEffect(() => setStage("payment"), [setStage])
    return <CheckoutStepper />
}

test("returns from payment to the billing element through the header stepper", async () => {
    const user = userEvent.setup()
    render(
        <CheckoutStageProvider>
            <StartAtPayment />
        </CheckoutStageProvider>
    )

    const billingStep = await screen.findByRole("button", { name: /Billing Address/ })
    await waitFor(() => assert.equal((billingStep as HTMLButtonElement).disabled, false))
    await user.click(billingStep)

    assert.equal((screen.getByRole("button", { name: /Billing Address/ }) as HTMLButtonElement).disabled, true)
    cleanup()
})
