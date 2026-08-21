"use client"

import type { CheckoutData } from "@/lib/cms"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, EmailInput, emailValidation } from "@code0-tech/pictor"
import { type FormEvent, useEffect, useState } from "react"

type SendOfferContent = Pick<CheckoutData["form"], "emailLabel" | "emailPlaceholder" | "sendOfferDescription" | "sendOfferLabel" | "sendOfferTitle">

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

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!validEmail) return

        // The dialog already exposes the integration boundary; the actual offer-delivery request is added later.
        void onSend?.(normalizedEmail)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="normal" className="h-10! w-full! border-white/10! bg-white/3! text-sm! text-secondary! hover:bg-white/6! hover:text-white!">
                    {content.sendOfferLabel}
                </Button>
            </DialogTrigger>
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
