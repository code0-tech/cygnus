import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutPromotionCodeSdk } from "../../src/lib/checkout/stripeCheckout"
import type { StripeCheckoutSession } from "@stripe/stripe-js"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()
const DialogTestContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)
function TestDialog({ children, open = false, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
    return <DialogTestContext.Provider value={{ open, setOpen: onOpenChange ?? (() => {}) }}>{children}</DialogTestContext.Provider>
}
function TestDialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }> }) {
    const dialog = React.useContext(DialogTestContext)
    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        dialog?.setOpen(true)
    }
    return asChild ? React.cloneElement(children, { onClick }) : <button type="button" onClick={onClick}>{children}</button>
}
function TestDialogPortal({ children }: { children: React.ReactNode }) {
    return React.useContext(DialogTestContext)?.open ? <>{children}</> : null
}
function TestDialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }> }) {
    const dialog = React.useContext(DialogTestContext)
    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        dialog?.setOpen(false)
    }
    return asChild ? React.cloneElement(children, { onClick }) : <button type="button" onClick={onClick}>{children}</button>
}
let currentSearchParams = new URLSearchParams()
mock.module("next/navigation", {
    namedExports: {
        useParams: () => ({ locale: "en" }),
        usePathname: () => "/en/checkout",
        useRouter: () => ({ replace: () => {} }),
        useSearchParams: () => currentSearchParams,
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Dialog: TestDialog,
        DialogClose: TestDialogClose,
        DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div role="dialog" {...props}>{children}</div>,
        DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        DialogOverlay: () => null,
        DialogPortal: TestDialogPortal,
        DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
        DialogTrigger: TestDialogTrigger,
        TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <div className="input"><input {...props} /></div>,
    },
})
mock.module("@/components/ui/Switch", { namedExports: { Switch: () => null } })
mock.module("@/components/checkout/summary/CheckoutPricingOverview", { namedExports: { CheckoutPricingOverview: () => null } })
const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutDiscount } = await import("../../src/components/checkout/summary/CheckoutSummary")
const props = {
    authenticated: true,
    buttonLabel: "Apply",
    inputPlaceholder: "Discount code",
    promptLabel: "Have a discount?",
    removeLabel: "Remove",
    discountSessionRequiredError: "A checkout session is required.",
    discountValidationError: "The discount code could not be validated.",
}
const updatedSession = { currency: "eur", minorUnitsAmountDivisor: 100, tax: { status: "ready" }, total: {
    discount: { minorUnitsAmount: 700 }, subtotal: { minorUnitsAmount: 1500 },
    taxExclusive: { minorUnitsAmount: 152 }, total: { minorUnitsAmount: 952 },
} } as StripeCheckoutSession
function sdk(callback: (code: string | null) => Promise<void> = async () => {}) {
    const current: CheckoutPromotionCodeSdk = {
        applyPromotionCode: async (code) => { await callback(code); return { type: "success", session: updatedSession } },
        removePromotionCode: async () => { await callback(null); return { type: "success", session: updatedSession } },
    }
    return { current }
}
afterEach(() => {
    cleanup()
    currentSearchParams = new URLSearchParams()
    window.history.replaceState(null, "", "/en/checkout")
})

test("applies and removes a promotion code directly through the active Stripe SDK", async () => {
    const requestedCodes: Array<string | null> = []
    const appliedValues: Array<string | null> = []
    const user = userEvent.setup()
    render(<><div id="applied-discount" data-testid="applied-discount" /><CheckoutDiscount {...props} appliedContainerId="applied-discount" onApplied={(code) => appliedValues.push(code)} checkoutRef={sdk(async (code) => { requestedCodes.push(code) })} /></>)
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
    render(<CheckoutDiscount {...props} checkoutRef={sdk()} />)
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
    const checkoutRef = sdk(async () => { requests += 1 })
    const view = render(<CheckoutDiscount {...props} sessionReady={false} checkoutRef={checkoutRef} />)
    assert.equal(requests, 0)
    view.rerender(<CheckoutDiscount {...props} sessionReady checkoutRef={checkoutRef} />)
    await waitFor(() => assert.equal(requests, 1))
    assert.ok(await screen.findByText("WELCOME"))
    assert.equal(window.location.search, "?plan=pro&promotionCode=WELCOME")
})

test("shows a discount only after the checkout confirms it", async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => { finish = resolve })
    const applied: Array<string | null> = []
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} onApplied={(code) => applied.push(code)} checkoutRef={sdk(() => pending)} />)
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
        render(<CheckoutDiscount {...props} checkoutRef={sdk(async () => { throw failure })} />)
        await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
        await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "INVALID")
        await user.click(screen.getByRole("button", { name: "Apply" }))
        assert.ok(await screen.findByText(message))
        assert.equal(window.location.search, "")
    })
}

test("forwards Stripe's success session and displays its supplied discount amount", async () => {
    const sessions: StripeCheckoutSession[] = []
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} checkoutRef={sdk()} onSessionChange={(session) => sessions.push(session)} appliedAmount="�7.00" />)
    await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "SAVE")
    await user.click(screen.getByRole("button", { name: props.buttonLabel }))
    await waitFor(() => assert.deepEqual(sessions, [updatedSession]))
    assert.ok(screen.getByText("-�7.00"))
})

test("shows Stripe's returned validation error without applying the code", async () => {
    const checkoutRef = sdk()
    checkoutRef.current.applyPromotionCode = async () => ({ type: "error", error: { code: "invalidCode", message: "This code is not valid for this subscription." } })
    const sessions: StripeCheckoutSession[] = []
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} checkoutRef={checkoutRef} onSessionChange={(session) => sessions.push(session)} />)
    await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "INVALID")
    await user.click(screen.getByRole("button", { name: props.buttonLabel }))
    assert.ok(await screen.findByText("This code is not valid for this subscription."))
    assert.deepEqual(sessions, [])
    assert.equal(window.location.search, "")
})

test("keeps the code and amount when Stripe refuses removal and displays its error", async () => {
    const checkoutRef = sdk()
    checkoutRef.current.removePromotionCode = async () => ({ type: "error", error: { code: null, message: "The checkout session could not be updated." } })
    const applied: Array<string | null> = []
    const user = userEvent.setup()
    render(<CheckoutDiscount {...props} checkoutRef={checkoutRef} onApplied={(code) => applied.push(code)} appliedAmount="�7.00" />)
    await user.click(screen.getAllByRole("button", { name: props.promptLabel }).at(-1)!)
    await user.type(screen.getByPlaceholderText(props.inputPlaceholder), "SAVE")
    await user.click(screen.getByRole("button", { name: props.buttonLabel }))
    await screen.findByText("SAVE")
    await user.click(screen.getByRole("button", { name: "(Remove)" }))
    assert.ok(await screen.findByRole("alert"))
    assert.ok(screen.getByText("The checkout session could not be updated."))
    assert.ok(screen.getByText("-�7.00"))
    assert.deepEqual(applied, ["SAVE"])
    assert.equal(window.location.search, "?promotionCode=SAVE")
})
