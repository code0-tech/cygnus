"use client"

import { Button } from "@code0-tech/pictor"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export interface CheckoutDiscountValue {
    amountOff: number | null
    code: string
    currency: string | null
    duration: string
    percentOff: number | null
}

interface CheckoutDiscountProps {
    buttonLabel: string
    inputPlaceholder: string
    onApplied?: (discount: CheckoutDiscountValue | null) => void
    sessionToken?: string | null
}

export function CheckoutDiscount({ buttonLabel, inputPlaceholder, onApplied, sessionToken }: CheckoutDiscountProps) {
    const { token: contextSessionToken } = useCraterSession()
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [code, setCode] = useState(searchParams.get("promotionCode") ?? "")
    const [appliedCode, setAppliedCode] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isApplying, setIsApplying] = useState(false)
    const authorizationToken = sessionToken ?? contextSessionToken

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        const normalizedCode = code.trim()
        if (!normalizedCode || isApplying) return

        if (!authorizationToken) {
            setErrorMessage("A Crater session is required to validate a discount.")
            return
        }

        setIsApplying(true)
        setErrorMessage(null)

        try {
            const response = await fetch("/api/crater/checkout/discount", {
                method: "POST",
                headers: {
                    authorization: `Session ${authorizationToken}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify({ code: normalizedCode }),
            })
            const result = await response.json()

            if (!response.ok) {
                const details = Array.isArray(result.details) ? result.details.filter((detail: unknown) => typeof detail === "string").join(" ") : ""
                throw new Error(details || result.error || "Could not validate the discount.")
            }

            const discount = result as CheckoutDiscountValue
            const nextSearchParams = new URLSearchParams(searchParams.toString())
            nextSearchParams.set("promotionCode", discount.code)
            router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
            setCode(discount.code)
            setAppliedCode(discount.code)
            onApplied?.(discount)
        } catch (error) {
            setAppliedCode(null)
            setErrorMessage(error instanceof Error ? error.message : "Could not validate the discount.")
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2 pt-4">
            <div className="flex items-start gap-2">
                <input
                    aria-label={inputPlaceholder}
                    autoComplete="off"
                    className="h-10 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-tertiary hover:bg-white/8 focus:border-brand/40 focus:bg-white/8"
                    maxLength={128}
                    onChange={(event) => {
                        setCode(event.currentTarget.value)
                        setAppliedCode(null)
                        setErrorMessage(null)
                        onApplied?.(null)
                    }}
                    placeholder={inputPlaceholder}
                    value={code}
                />
                <Button
                    type="submit"
                    variant="normal"
                    disabled={!code.trim() || isApplying || appliedCode === code.trim()}
                    className="h-10! shrink-0 px-5! whitespace-nowrap bg-white/80! hover:bg-white! ring-1! ring-white/20! text-sm! text-primary!"
                >
                    {buttonLabel}
                </Button>
            </div>
            {errorMessage && (
                <p className="text-error text-xs" role="alert">
                    {errorMessage}
                </p>
            )}
        </form>
    )
}
