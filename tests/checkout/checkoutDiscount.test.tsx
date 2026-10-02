import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()
let currentSearchParams = new URLSearchParams()
mock.module("next/navigation", { namedExports: { usePathname: () => "/en/checkout", useSearchParams: () => currentSearchParams } })
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <div className="input"><input {...props} /></div>,
    },
})
const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutDiscount } = await import("../../src/components/checkout/CheckoutDiscount")
const props = {
    authenticated: true,
    buttonLabel: "Apply",
    inputPlaceholder: "Discount code",
    promptLabel: "Have a discount?",
    removeLabel: "Remove",
    discountSessionRequiredError: "A checkout session is required.",
    discountValidationError: "The discount code could not be validated.",
}
afterEach(() => {
    cleanup()
    currentSearchParams = new URLSearchParams()
    window.history.replaceState(null, "", "/en/checkout")
})

test("applies and removes a promotion code through the active checkout callback", async () => {
    const requestedCodes: Array<string | null> = []
    const appliedValues: Array<string | null> = []
    const user = userEvent.setup()
    render(<><div id="applied-discount" data-testid="applied-discount" /><CheckoutDiscount {...props} appliedContainerId="applied-discount" onApplied={(code) => appliedValues.push(code)} onPromotionCodeChange={async (code) => { requestedCodes.push(code) }} /></>)
    const prompt = screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!
    await user.click(prompt)
    await user.click(prompt)
    assert.equal(screen.queryByPlaceholderText(props.inputPlaceholder), null)
    await user.click(prompt)
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), " SAVE10 ")
    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => assert.equal(appliedValues.at(-1), "SAVE10"))
    assert.deepEqual(requestedCodes, ["SAVE10"])
    assert.equal(window.location.search, "?promotionCode=SAVE10")
    assert.ok(screen.getByTestId("applied-discount").contains(screen.getByText("SAVE10")))
    await user.click(screen.getByRole("button", { name: "(Remove)" }))
    await waitFor(() => assert.equal(appliedValues.at(-1), null))
    assert.deepEqual(requestedCodes, ["SAVE10", null])
    assert.equal(window.location.search, "")
})

test("applies a promotion code in the mobile dialog", async () => {
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} onPromotionCodeChange={async () => {}} />)
    await user.click(screen.getAllByRole("button", { name: props.promptLabel })[0])
    assert.ok(screen.getByRole("dialog").contains(screen.getByPlaceholderText(props.inputPlaceholder)))
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "SAVE10")
    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null))
    assert.ok(screen.getByText("SAVE10"))
})

test("waits for the checkout session before applying a code from the URL", async () => {
    currentSearchParams = new URLSearchParams("plan=pro&promotionCode=WELCOME")
    let requests = 0
    const callback = async () => { requests += 1 }
    const view = render(<CheckoutDiscount {...props} sessionReady={false} onPromotionCodeChange={callback} />)
    assert.equal(requests, 0)
    view.rerender(<CheckoutDiscount {...props} sessionReady onPromotionCodeChange={callback} />)
    await waitFor(() => assert.equal(requests, 1))
    assert.ok(await screen.findByText("WELCOME"))
    assert.equal(window.location.search, "?plan=pro&promotionCode=WELCOME")
})

test("shows a discount only after the checkout confirms it", async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => { finish = resolve })
    const applied: Array<string | null> = []
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} onApplied={(code) => applied.push(code)} onPromotionCodeChange={() => pending} />)
    await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "SAVE10")
    await user.click(screen.getByRole("button", { name: "Apply" }))
    assert.equal((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled, true)
    assert.deepEqual(applied, [])
    assert.equal(screen.queryByText("SAVE10"), null)
    finish()
    await waitFor(() => assert.equal(applied.at(-1), "SAVE10"))
})

for (const [failure, message] of [[new Error("This promotion code has expired."), "This promotion code has expired."], [null, props.discountValidationError]] as const) {
    test(`shows the checkout rejection: ${message}`, async () => {
        const user = userEvent.setup()
        render(<CheckoutDiscount {...props} onPromotionCodeChange={async () => { throw failure }} />)
        await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
        await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "INVALID")
        await user.click(screen.getByRole("button", { name: "Apply" }))
        assert.ok(await screen.findByText(message))
        assert.equal(window.location.search, "")
    })
}
