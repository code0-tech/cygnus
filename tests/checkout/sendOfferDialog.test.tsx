import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

const passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>
mock.module("@code0-tech/pictor", {
    namedExports: {
        Alert: ({ children, color }: { children: React.ReactNode; color?: string }) => <div role={color === "error" ? "alert" : "status"}>{children}</div>,
        AutoScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollAreaViewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollAreaScrollbar: () => null,
        ScrollAreaThumb: () => null,
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Dialog: passthrough,
        DialogClose: passthrough,
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

const { cleanup, render, screen } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { SendOfferDialog } = await import("../../src/components/checkout/shared/SendOfferDialog")

const content = {
    emailLabel: "Email",
    emailPlaceholder: "offer@example.com",
    processingLabel: "Processing...",
    sendOfferDescription: "Enter the recipient email address.",
    sendOfferLabel: "Send offer",
    sendOfferPrompt: "Need an invoice or a quote first?",
    sendOfferSuccess: "We sent the offer to {email}.",
    sendOfferTitle: "Send an offer",
}

afterEach(() => cleanup())

function submitButton() {
    return (screen.getAllByRole("button", { name: content.sendOfferLabel }) as HTMLButtonElement[]).at(-1)!
}

test("sends the entered email and confirms the recipient", async () => {
    const onSend = mock.fn(async (_email: string) => {})
    render(<SendOfferDialog content={content} onSend={onSend} />)
    assert.ok(screen.getByText(content.sendOfferPrompt))

    assert.equal(submitButton().disabled, true)
    await userEvent.setup().type(screen.getByRole("textbox", { name: content.emailLabel }), "buyer@example.com")
    assert.equal(submitButton().disabled, false)
    await userEvent.setup().click(submitButton())

    assert.deepEqual(onSend.mock.calls[0]?.arguments, ["buyer@example.com"])
    assert.equal((await screen.findByRole("status")).textContent, "We sent the offer to buyer@example.com.")
    assert.equal(screen.queryByRole("textbox", { name: content.emailLabel }), null)
})

test("shows the resolved error message and keeps the form for another attempt", async () => {
    const onSend = mock.fn(async (_email: string) => {
        throw new Error("The offer could not be sent.")
    })
    render(<SendOfferDialog content={content} initialEmail="buyer@example.com" onSend={onSend} />)

    await userEvent.setup().click(submitButton())

    assert.equal((await screen.findByRole("alert")).textContent, "The offer could not be sent.")
    assert.equal(submitButton().disabled, false)
})

test("a guest checkout shows its own address without letting it be changed", () => {
    render(<SendOfferDialog content={content} emailLocked initialEmail="guest@example.com" onSend={async () => {}} />)

    const input = screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement
    assert.equal(input.value, "guest@example.com")
    assert.equal(input.disabled, true)
})

test("the trigger stays disabled until a billing customer can be made out", () => {
    render(<SendOfferDialog content={content} disabled onSend={async () => {}} />)

    assert.equal((screen.getAllByRole("button", { name: content.sendOfferLabel }) as HTMLButtonElement[])[0].disabled, true)
})
