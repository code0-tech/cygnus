"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import { Button, EmailInput, emailValidation } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useState } from "react"

interface CheckoutGuestFormProps {
    emailLabel: string
    emailPlaceholder: string
    errorMessage: string
    guestHref: string
    submitLabel: string
}

export function CheckoutGuestForm({ emailLabel, emailPlaceholder, errorMessage, guestHref, submitLabel }: CheckoutGuestFormProps) {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const normalizedEmail = email.trim()
    const validEmail = emailValidation(normalizedEmail)

    const submit = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault()
        if (!validEmail || isSubmitting) return

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/guest", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail }),
                referrerPolicy: "no-referrer",
            })
            if (!response.ok) throw new Error(errorMessage)

            const result: unknown = await response.json()
            if (!result || typeof result !== "object" || !("checkoutId" in result) || typeof result.checkoutId !== "string") throw new Error(errorMessage)
            const target = new URL(guestHref, window.location.origin)
            target.searchParams.set("guestCheckout", result.checkoutId)
            router.push(`${target.pathname}${target.search}`)
        } catch {
            setError(errorMessage)
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={(event) => void submit(event)} className="w-full space-y-3">
            <EmailInput
                title={emailLabel}
                name="guest-email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder={emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="w-full!"
            />
            <Button type="submit" variant="normal" disabled={!validEmail || isSubmitting} className="h-11! w-full! font-medium! text-base!">
                {isSubmitting ? <ButtonLoader label={submitLabel} /> : submitLabel}
            </Button>
            {error && (
                <p role="alert" className="text-sm text-error">
                    {error}
                </p>
            )}
        </form>
    )
}
