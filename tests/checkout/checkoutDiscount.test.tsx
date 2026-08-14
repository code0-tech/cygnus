import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

let currentSearchParams = new URLSearchParams()

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/checkout",
        useSearchParams: () => currentSearchParams,
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
})

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutDiscount } = await import("../../src/components/checkout/CheckoutDiscount")
type CheckoutDiscountValue = import("../../src/components/checkout/CheckoutDiscount").CheckoutDiscountValue

const originalFetch = globalThis.fetch
const discountErrorProps = {
    discountSessionRequiredError: "A checkout session is required.",
    discountValidationError: "The discount code could not be validated.",
}

afterEach(() => {
    cleanup()
    currentSearchParams = new URLSearchParams()
    window.history.replaceState(null, "", "/en/checkout")
    globalThis.fetch = originalFetch
})

function discountResponse(code: string, percentOff: number) {
    return new Response(
        JSON.stringify({
            amountOff: null,
            code,
            currency: null,
            duration: "forever",
            percentOff,
        }),
        {
            status: 200,
            headers: { "content-type": "application/json" },
        }
    )
}

test("opens, applies, and removes a discount code", async () => {
    const requestedCodes: string[] = []
    globalThis.fetch = (async (_input, init) => {
        const body = JSON.parse(String(init?.body))
        requestedCodes.push(body.code)
        return discountResponse(body.code, body.code === "SAVE20" ? 20 : 10)
    }) as typeof fetch
    const appliedValues: Array<CheckoutDiscountValue | null> = []
    const user = userEvent.setup()

    render(
        <>
            <div id="applied-discount" data-testid="applied-discount" />
            <CheckoutDiscount
                {...discountErrorProps}
                appliedContainerId="applied-discount"
                buttonLabel="Apply"
                inputPlaceholder="Discount code"
                promptLabel="Have a discount?"
                removeLabel="Remove"
                authenticated
                onApplied={(discount) => appliedValues.push(discount)}
            />
        </>
    )

    const promptButton = screen.getAllByRole("button", { name: "Have a discount?" }).at(-1)!
    await user.click(promptButton)
    assert.ok(screen.getByPlaceholderText("Discount code"))
    await user.click(promptButton)
    assert.equal(screen.queryByPlaceholderText("Discount code"), null)
    await user.click(promptButton)

    const input = screen.getByPlaceholderText("Discount code")
    const applyButton = screen.getByRole("button", { name: "Apply" })

    await user.type(input, "SAVE10")
    await user.click(applyButton)
    await waitFor(() => assert.equal(appliedValues.at(-1)?.code, "SAVE10"))
    assert.deepEqual(requestedCodes, ["SAVE10"])
    assert.equal(window.location.pathname + window.location.search, "/en/checkout?promotionCode=SAVE10")
    assert.ok(screen.getByText("SAVE10"))
    assert.ok(screen.getByTestId("applied-discount").contains(screen.getByText("SAVE10")))

    await user.click(screen.getByRole("button", { name: "(Remove)" }))
    await waitFor(() => assert.equal(appliedValues.at(-1), null))
    assert.deepEqual(requestedCodes, ["SAVE10"])
    assert.equal(window.location.pathname + window.location.search, "/en/checkout")
    assert.equal(screen.getAllByRole("button", { name: "Have a discount?" }).length, 2)
})

test("opens the discount input in a dialog on mobile", async () => {
    globalThis.fetch = (async (_input, init) => {
        const body = JSON.parse(String(init?.body))
        return discountResponse(body.code, 10)
    }) as typeof fetch
    const user = userEvent.setup()

    render(<CheckoutDiscount {...discountErrorProps} authenticated buttonLabel="Apply" inputPlaceholder="Discount code" promptLabel="Have a discount?" removeLabel="Remove" />)

    const mobilePrompt = screen.getAllByRole("button", { name: "Have a discount?" })[0]
    await user.click(mobilePrompt)

    const dialog = screen.getByRole("dialog", { name: "Have a discount?" })
    const input = screen.getByPlaceholderText("Discount code")
    assert.ok(dialog.contains(input))

    await user.type(input, "SAVE10")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    await waitFor(() => assert.equal(screen.queryByRole("dialog", { name: "Have a discount?" }), null))
    assert.ok(screen.getByText("SAVE10"))
})

test("validates and applies a promotion code already present in the URL", async () => {
    currentSearchParams = new URLSearchParams("plan=pro&promotionCode=WELCOME")
    window.history.replaceState(null, "", "/en/checkout?plan=pro&promotionCode=WELCOME")
    globalThis.fetch = (async () => discountResponse("WELCOME", 15)) as typeof fetch
    const appliedValues: Array<CheckoutDiscountValue | null> = []

    render(
        <CheckoutDiscount
            {...discountErrorProps}
            buttonLabel="Apply"
            inputPlaceholder="Discount code"
            promptLabel="Have a discount?"
            removeLabel="Remove"
            authenticated
            onApplied={(discount) => appliedValues.push(discount)}
        />
    )

    await waitFor(() => assert.equal(appliedValues.at(-1)?.code, "WELCOME"))
    assert.ok(screen.getByText("WELCOME"))
    assert.ok(screen.getByRole("button", { name: "(Remove)" }))
    assert.equal(window.location.pathname + window.location.search, "/en/checkout?plan=pro&promotionCode=WELCOME")
})

test("shows the configured CMS error instead of the Crater discount error", async () => {
    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ error: "Raw Crater discount error", details: ["Raw validation detail"] }), {
            status: 422,
            headers: { "content-type": "application/json" },
        })) as typeof fetch
    const user = userEvent.setup()

    render(
        <CheckoutDiscount
            {...discountErrorProps}
            authenticated
            buttonLabel="Apply"
            inputPlaceholder="Discount code"
            promptLabel="Have a discount?"
            removeLabel="Remove"
        />
    )

    await user.click(screen.getAllByRole("button", { name: "Have a discount?" }).at(-1)!)
    await user.type(screen.getByPlaceholderText("Discount code"), "INVALID")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    assert.ok(await screen.findByText(discountErrorProps.discountValidationError))
    assert.equal(screen.queryByText("Raw Crater discount error"), null)
    assert.equal(screen.queryByText("Raw validation detail"), null)
})
