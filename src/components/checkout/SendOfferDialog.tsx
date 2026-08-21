"use client"

import type { CheckoutData } from "@/lib/cms"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, EmailInput, emailValidation } from "@code0-tech/pictor"
import { type SubmitEvent, useEffect, useState } from "react"

type SendOfferContent = Pick<CheckoutData["form"], "emailLabel" | "emailPlaceholder" | "sendOfferDescription" | "sendOfferLabel" | "sendOfferPrompt" | "sendOfferTitle">

interface SendOfferDialogProps {
    content: SendOfferContent
    initialEmail?: string | null
    onSend?: (email: string) => Promise<void> | void
}

export function SendOfferDialog({ content, initialEmail, onSend }: SendOfferDialogProps) {
    const [email, setEmail] = useState(initialEmail?.trim() ?? "")
    const normalizedEmail = email.trim()
    const validEmail = emailValidation(normalizedEmail)

    useEffect(() => setEmail(initialEmail?.trim() ?? ""), [initialEmail])

    const submit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!validEmail) return

        void onSend?.(normalizedEmail)
    }

    return (
        <Dialog>
            <span className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-secondary">
                <span>{content.sendOfferPrompt}</span>
                <DialogTrigger asChild>
                    <Button type="button" variant="none" className="h-auto! w-auto! p-0! text-sm! text-brand! shadow-none! hover:bg-transparent! hover:underline! hover:text-brand!">
                        {content.sendOfferLabel}
                    </Button>
                </DialogTrigger>
            </span>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="w-[calc(100vw-2rem)]! max-w-md! border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="font-normal! text-white!">{content.sendOfferTitle}</DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{content.sendOfferDescription}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-5 pt-5">
                        <EmailInput
                            title={content.emailLabel}
                            name="offer-email"
                            autoComplete="email"
                            maxLength={254}
                            placeholder={content.emailPlaceholder}
                            value={email}
                            onChange={(event) => setEmail(event.currentTarget.value)}
                            className="w-full!"
                        />
                        <DialogFooter>
                            <Button type="submit" variant="filled" disabled={!validEmail}>
                                {content.sendOfferLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
