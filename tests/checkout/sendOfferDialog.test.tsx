import assert from "node:assert/strict"
import test, { mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

const passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Dialog: passthrough,
        DialogContent: passthrough,
        DialogDescription: passthrough,
        DialogFooter: passthrough,
        DialogHeader: passthrough,
        DialogOverlay: () => null,
        DialogPortal: passthrough,
        DialogTitle: passthrough,
        DialogTrigger: passthrough,
        EmailInput: ({ title, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { title?: string }) => <input aria-label={title} {...props} />,
        emailValidation: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
})

const { render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { SendOfferDialog } = await import("../../src/components/checkout/SendOfferDialog")

const content = {
    emailLabel: "Email",
    emailPlaceholder: "offer@example.com",
    sendOfferDescription: "Enter the recipient email address.",
    sendOfferLabel: "Send offer",
    sendOfferPrompt: "Need an invoice or a quote first?",
    sendOfferTitle: "Send an offer",
}

test("collects a valid email and exposes it through the future send integration", async () => {
    const onSend = mock.fn()
    render(<SendOfferDialog content={content} onSend={onSend} />)
    assert.ok(screen.getByText(content.sendOfferPrompt))
    const sendButtons = screen.getAllByRole("button", { name: content.sendOfferLabel }) as HTMLButtonElement[]
    const submitButton = sendButtons.at(-1)!

    assert.equal(submitButton.disabled, true)
    await userEvent.setup().type(screen.getByRole("textbox", { name: content.emailLabel }), "buyer@example.com")
    assert.equal(submitButton.disabled, false)
    await userEvent.setup().click(submitButton)

    assert.deepEqual(onSend.mock.calls[0]?.arguments, ["buyer@example.com"])
})
