import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

let currentSearchParams = new URLSearchParams()
const replacedUrls: string[] = []

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/checkout",
        useRouter: () => ({
            replace: (url: string) => {
                replacedUrls.push(url)
                currentSearchParams = new URLSearchParams(url.split("?")[1] ?? "")
            },
        }),
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

afterEach(() => {
    cleanup()
    currentSearchParams = new URLSearchParams()
    replacedUrls.length = 0
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

test("applies, replaces, and clears only confirmed discount input values", async () => {
    const requestedCodes: string[] = []
    globalThis.fetch = (async (_input, init) => {
        const body = JSON.parse(String(init?.body))
        requestedCodes.push(body.code)
        return discountResponse(body.code, body.code === "SAVE20" ? 20 : 10)
    }) as typeof fetch
    const appliedValues: Array<CheckoutDiscountValue | null> = []
    const user = userEvent.setup()

    render(<CheckoutDiscount buttonLabel="Apply" inputPlaceholder="Discount code" sessionToken="session-token" onApplied={(discount) => appliedValues.push(discount)} />)

    const input = screen.getByPlaceholderText("Discount code")
    const applyButton = screen.getByRole("button", { name: "Apply" })

    await user.type(input, "SAVE10")
    await user.click(applyButton)
    await waitFor(() => assert.equal(appliedValues.at(-1)?.code, "SAVE10"))
    assert.deepEqual(requestedCodes, ["SAVE10"])
    assert.equal(replacedUrls.at(-1), "/en/checkout?promotionCode=SAVE10")

    const confirmedValueCount = appliedValues.length
    await user.clear(input)
    await user.type(input, "SAVE20")
    assert.equal(appliedValues.length, confirmedValueCount)
    assert.equal(appliedValues.at(-1)?.code, "SAVE10")

    await user.click(applyButton)
    await waitFor(() => assert.equal(appliedValues.at(-1)?.code, "SAVE20"))
    assert.deepEqual(requestedCodes, ["SAVE10", "SAVE20"])
    assert.ok(replacedUrls.includes("/en/checkout"))
    assert.equal(replacedUrls.at(-1), "/en/checkout?promotionCode=SAVE20")

    await user.clear(input)
    assert.equal(appliedValues.at(-1)?.code, "SAVE20")
    await user.click(applyButton)
    await waitFor(() => assert.equal(appliedValues.at(-1), null))
    assert.deepEqual(requestedCodes, ["SAVE10", "SAVE20"])
    assert.equal(replacedUrls.at(-1), "/en/checkout")
})

test("validates and applies a promotion code already present in the URL", async () => {
    currentSearchParams = new URLSearchParams("plan=pro&promotionCode=WELCOME")
    globalThis.fetch = (async () => discountResponse("WELCOME", 15)) as typeof fetch
    const appliedValues: Array<CheckoutDiscountValue | null> = []

    render(<CheckoutDiscount buttonLabel="Apply" inputPlaceholder="Discount code" sessionToken="session-token" onApplied={(discount) => appliedValues.push(discount)} />)

    await waitFor(() => assert.equal(appliedValues.at(-1)?.code, "WELCOME"))
    assert.equal((screen.getByPlaceholderText("Discount code") as HTMLInputElement).value, "WELCOME")
    assert.equal(replacedUrls.at(-1), "/en/checkout?plan=pro&promotionCode=WELCOME")
})
