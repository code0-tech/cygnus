"use client"

import { Button } from "@code0-tech/pictor"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import type { CheckoutDiscount as CraterCheckoutDiscount } from "@code0-tech/crater-graphql-types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type CheckoutDiscountFields = Required<Pick<CraterCheckoutDiscount, "amountOff" | "code" | "currency" | "duration" | "percentOff">>

export type CheckoutDiscountValue = Omit<CheckoutDiscountFields, "code" | "duration"> & {
    code: NonNullable<CraterCheckoutDiscount["code"]>
    duration: NonNullable<CraterCheckoutDiscount["duration"]>
}

interface CheckoutDiscountProps {
    appliedAmount?: string | null
    buttonLabel: string
    inputPlaceholder: string
    onApplied?: (discount: CheckoutDiscountValue | null) => void
    promptLabel: string
    removeLabel: string
    sessionToken?: string | null
}

export function CheckoutDiscount({ appliedAmount, buttonLabel, inputPlaceholder, onApplied, promptLabel, removeLabel, sessionToken }: CheckoutDiscountProps) {
    const { token: contextSessionToken } = useCraterSession()
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [code, setCode] = useState(searchParams.get("promotionCode") ?? "")
    const [appliedCode, setAppliedCode] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isApplying, setIsApplying] = useState(false)
    const [isEditing, setIsEditing] = useState(Boolean(searchParams.get("promotionCode")))
    const authorizationToken = sessionToken ?? contextSessionToken
    const validationRequestRef = useRef(0)
    const automaticallyValidatedCodeRef = useRef<string | null>(null)

    const replacePromotionCode = useCallback(
        (nextCode: string | null) => {
            const nextSearchParams = new URLSearchParams(searchParams.toString())

            if (nextCode) {
                nextSearchParams.set("promotionCode", nextCode)
            } else {
                nextSearchParams.delete("promotionCode")
            }

            const query = nextSearchParams.toString()
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
        },
        [pathname, router, searchParams]
    )

    const validateDiscount = useCallback(
        async (normalizedCode: string) => {
            if (!authorizationToken) {
                setErrorMessage("A Crater session is required to validate a discount.")
                return
            }

            const requestId = ++validationRequestRef.current
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

                if (requestId !== validationRequestRef.current) return

                const discount = result as CheckoutDiscountValue
                replacePromotionCode(discount.code)
                setCode((currentCode) => (currentCode.trim() === normalizedCode ? discount.code : currentCode))
                setAppliedCode(discount.code)
                setIsEditing(false)
                onApplied?.(discount)
            } catch (error) {
                if (requestId !== validationRequestRef.current) return

                replacePromotionCode(null)
                setAppliedCode(null)
                onApplied?.(null)
                setErrorMessage(error instanceof Error ? error.message : "Could not validate the discount.")
            } finally {
                if (requestId === validationRequestRef.current) {
                    setIsApplying(false)
                }
            }
        },
        [authorizationToken, onApplied, replacePromotionCode]
    )

    useEffect(() => {
        const promotionCode = searchParams.get("promotionCode")?.trim()

        if (!authorizationToken || !promotionCode || appliedCode === promotionCode || automaticallyValidatedCodeRef.current === promotionCode) {
            return
        }

        automaticallyValidatedCodeRef.current = promotionCode
        setCode(promotionCode)
        void validateDiscount(promotionCode)
    }, [appliedCode, authorizationToken, searchParams, validateDiscount])

    const applyEmptyDiscount = () => {
        validationRequestRef.current += 1
        automaticallyValidatedCodeRef.current = searchParams.get("promotionCode")?.trim() ?? null
        setAppliedCode(null)
        setCode("")
        setErrorMessage(null)
        setIsApplying(false)
        setIsEditing(false)
        replacePromotionCode(null)
        onApplied?.(null)
    }

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        const normalizedCode = code.trim()
        if (isApplying) return

        if (normalizedCode !== appliedCode) {
            automaticallyValidatedCodeRef.current = searchParams.get("promotionCode")?.trim() ?? null
            setAppliedCode(null)
            replacePromotionCode(null)
            onApplied?.(null)
        }

        if (!normalizedCode) {
            applyEmptyDiscount()
            return
        }

        void validateDiscount(normalizedCode)
    }

    if (appliedCode) {
        return (
            <div className="flex min-w-0 items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-1">
                    <span className="min-w-0 truncate text-secondary">{appliedCode}</span>
                    <button type="button" onClick={applyEmptyDiscount} className="shrink-0 text-tertiary transition-colors hover:text-white">
                        ({removeLabel})
                    </button>
                </div>
                {appliedAmount && <span className="shrink-0 tabular-nums text-white">-{appliedAmount}</span>}
            </div>
        )
    }

    return (
        <div className="space-y-2 pt-2">
            <button
                type="button"
                aria-expanded={isEditing}
                onClick={() => {
                    setIsEditing((currentValue) => !currentValue)
                    setErrorMessage(null)
                }}
                className=" ml-4 text-left text-sm text-tertiary transition-colors hover:text-brand hover:underline underline-offset-2"
            >
                {promptLabel}
            </button>

            {isEditing && (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="flex items-start gap-2">
                        <input
                            aria-label={inputPlaceholder}
                            autoComplete="off"
                            className="h-10 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-tertiary hover:bg-white/8 focus:border-brand/40 focus:bg-white/8"
                            maxLength={128}
                            onChange={(event) => {
                                setCode(event.currentTarget.value)
                                setErrorMessage(null)
                            }}
                            placeholder={inputPlaceholder}
                            value={code}
                        />
                        <Button
                            type="submit"
                            variant="normal"
                            disabled={isApplying || code.trim() === (appliedCode ?? "")}
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
            )}
        </div>
    )
}
