import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

mock.module("@code0-tech/pictor", {
    namedExports: { Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div> },
})

const { cleanup, render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutBillingSummary, formatBillingAddressLines } = await import("../../src/components/checkout/form/CheckoutBillingSummary")

afterEach(cleanup)

const billingAddress = {
    name: "Marius Ahsmus",
    address: { line1: "Pfarrberg 16a", line2: null, postal_code: "04639", city: "Gößnitz", state: null, country: "DE" },
}

test("shows the selected billing address and returns to billing on change", async () => {
    let changes = 0
    const user = userEvent.setup()
    const { container } = render(<CheckoutBillingSummary billingAddress={billingAddress} changeLabel="Change" onChange={() => (changes += 1)} />)

    assert.deepEqual(
        [...container.querySelectorAll("p")].map((line) => line.textContent),
        ["Marius Ahsmus", "Pfarrberg 16a", "04639 Gößnitz DE"]
    )
    await user.click(screen.getByRole("button", { name: "Change" }))
    assert.equal(changes, 1)
})

test("disables change while a payment is being confirmed", () => {
    render(<CheckoutBillingSummary billingAddress={billingAddress} changeLabel="Change" disabled onChange={() => {}} />)

    assert.equal((screen.getByRole("button", { name: "Change" }) as HTMLButtonElement).disabled, true)
})

test("adds the tax ID below the address and omits an empty one", () => {
    const { container, rerender } = render(<CheckoutBillingSummary billingAddress={billingAddress} taxId="DE123456789" changeLabel="Change" onChange={() => {}} />)
    assert.deepEqual([...container.querySelectorAll("p")].map(line => line.textContent), [billingAddress.name, ...formatBillingAddressLines(billingAddress), "DE123456789"])
    rerender(<CheckoutBillingSummary billingAddress={billingAddress} taxId="" changeLabel="Change" onChange={() => {}} />)
    assert.equal(container.querySelectorAll("p").length, 3)
})

test("keeps the second address line and state", () => {
    assert.deepEqual(formatBillingAddressLines({ name: "", address: { line1: "1 Main St", line2: "Suite 2", postal_code: "94107", city: "San Francisco", state: "CA", country: "US" } }), [
        "1 Main St",
        "Suite 2",
        "94107 San Francisco CA US",
    ])
})
