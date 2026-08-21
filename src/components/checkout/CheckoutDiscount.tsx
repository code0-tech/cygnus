"use client"

import { Button, TextInput } from "@code0-tech/pictor"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { Dialog } from "@base-ui/react/dialog"
import type { CheckoutDiscount as CraterCheckoutDiscount } from "@code0-tech/crater-graphql-types"
import { IconX } from "@tabler/icons-react"
import { usePathname, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState } from "react"

type CheckoutDiscountFields = Required<Pick<CraterCheckoutDiscount, "amountOff" | "code" | "currency" | "duration" | "percentOff">>

export type CheckoutDiscountValue = Omit<CheckoutDiscountFields, "code" | "duration"> & {
    code: NonNullable<CraterCheckoutDiscount["code"]>
    duration: NonNullable<CraterCheckoutDiscount["duration"]>
}

interface CheckoutDiscountProps {
    authenticated?: boolean
    appliedContainerId?: string
    appliedAmount?: string | null
    buttonLabel: string
    discountSessionRequiredError: string
    discountValidationError: string
    inputPlaceholder: string
    onApplied?: (discount: CheckoutDiscountValue | null) => void
    onPromotionCodeChange?: (code: string | null) => Promise<"navigating" | "updated" | void>
    promptLabel: string
    removeLabel: string
    sessionReady?: boolean
}

export function CheckoutDiscount({
    appliedAmount,
    appliedContainerId,
    authenticated,
    buttonLabel,
    discountSessionRequiredError,
    discountValidationError,
    inputPlaceholder,
    onApplied,
    onPromotionCodeChange,
    promptLabel,
    removeLabel,
    sessionReady = true,
}: CheckoutDiscountProps) {
    const { authenticated: contextAuthenticated } = useCraterSession()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [code, setCode] = useState(searchParams.get("promotionCode") ?? "")
    const [appliedCode, setAppliedCode] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isApplying, setIsApplying] = useState(false)
    const [isEditing, setIsEditing] = useState(Boolean(searchParams.get("promotionCode")))
    const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false)
    const isAuthenticated = authenticated ?? contextAuthenticated
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
            window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname)
        },
        [pathname, searchParams]
    )

    const validateDiscount = useCallback(
        async (normalizedCode: string) => {
            if (!isAuthenticated || !sessionReady) {
                setErrorMessage(discountSessionRequiredError)
                return
            }

            const requestId = ++validationRequestRef.current
            setIsApplying(true)
            setErrorMessage(null)

            try {
                const response = await fetch("/api/crater/checkout/discount", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ code: normalizedCode }),
                    credentials: "same-origin",
                })
                const result = await response.json()

                if (!response.ok) {
                    const details = Array.isArray(result.details) ? result.details.filter((detail: unknown) => typeof detail === "string").join(" ") : ""
                    console.error("Crater discount validation failed:", details || result.error)
                    throw new Error("Discount validation failed")
                }

                if (requestId !== validationRequestRef.current) return

                const discount = result as CheckoutDiscountValue
                const promotionCodeChange = await onPromotionCodeChange?.(discount.code)
                if (promotionCodeChange === "navigating") return
                if (requestId !== validationRequestRef.current) return

                replacePromotionCode(discount.code)
                setCode((currentCode) => (currentCode.trim() === normalizedCode ? discount.code : currentCode))
                setAppliedCode(discount.code)
                setIsEditing(false)
                setIsMobileDialogOpen(false)
                onApplied?.(discount)
            } catch (error) {
                if (requestId !== validationRequestRef.current) return

                replacePromotionCode(null)
                setAppliedCode(null)
                onApplied?.(null)
                console.error("Failed to validate the checkout discount:", error)
                setErrorMessage(discountValidationError)
            } finally {
                if (requestId === validationRequestRef.current) {
                    setIsApplying(false)
                }
            }
        },
        [discountSessionRequiredError, discountValidationError, isAuthenticated, onApplied, onPromotionCodeChange, replacePromotionCode, sessionReady]
    )

    useEffect(() => {
        const promotionCode = searchParams.get("promotionCode")?.trim()

        if (!isAuthenticated || !sessionReady || !promotionCode || appliedCode === promotionCode || automaticallyValidatedCodeRef.current === promotionCode) {
            return
        }

        automaticallyValidatedCodeRef.current = promotionCode
        setCode(promotionCode)
        void validateDiscount(promotionCode)
    }, [appliedCode, isAuthenticated, searchParams, sessionReady, validateDiscount])

    const applyEmptyDiscount = async () => {
        if (isApplying) return

        const requestId = ++validationRequestRef.current
        setIsApplying(true)
        setErrorMessage(null)

        try {
            const promotionCodeChange = await onPromotionCodeChange?.(null)
            if (promotionCodeChange === "navigating") return
            if (requestId !== validationRequestRef.current) return

            automaticallyValidatedCodeRef.current = null
            setAppliedCode(null)
            setCode("")
            setIsEditing(false)
            replacePromotionCode(null)
            onApplied?.(null)
        } catch (error) {
            if (requestId !== validationRequestRef.current) return
            console.error("Failed to remove the checkout discount:", error)
            setErrorMessage(discountValidationError)
        } finally {
            if (requestId === validationRequestRef.current) setIsApplying(false)
        }
    }

    const clearUnappliedDiscount = () => {
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

        if (appliedCode && normalizedCode !== appliedCode) {
            automaticallyValidatedCodeRef.current = searchParams.get("promotionCode")?.trim() ?? null
            setAppliedCode(null)
            replacePromotionCode(null)
            onApplied?.(null)
        }

        if (!normalizedCode) {
            clearUnappliedDiscount()
            return
        }

        void validateDiscount(normalizedCode)
    }

    if (appliedCode) {
        const appliedDiscount = (
            <div className="flex min-w-0 items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-1">
                    <span className="min-w-0 truncate text-secondary">{appliedCode}</span>
                    <button type="button" disabled={isApplying} onClick={() => void applyEmptyDiscount()} className="shrink-0 text-tertiary transition-colors hover:text-white disabled:cursor-wait disabled:opacity-60">
                        ({removeLabel})
                    </button>
                </div>
                {appliedAmount && <span className="shrink-0 tabular-nums text-white">-{appliedAmount}</span>}
            </div>
        )
        const appliedContainer = appliedContainerId ? document.getElementById(appliedContainerId) : null
        return appliedContainer ? createPortal(appliedDiscount, appliedContainer) : appliedDiscount
    }

    const discountForm = (
        <form onSubmit={handleSubmit} className="w-full space-y-2">
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <TextInput
                        aria-label={inputPlaceholder}
                        autoComplete="off"
                        maxLength={128}
                        onChange={(event) => {
                            setCode(event.currentTarget.value)
                            setErrorMessage(null)
                        }}
                        placeholder={inputPlaceholder}
                        value={code}
                    />
                </div>
                <Button
                    type="submit"
                    variant="normal"
                    disabled={!sessionReady || isApplying || code.trim() === (appliedCode ?? "")}
                    className="h-10! shrink-0 px-5! whitespace-nowrap bg-white/80! hover:bg-white! ring-1! ring-white/20! text-sm! text-primary!"
                >
                    {isApplying ? <ButtonLoader label={buttonLabel} /> : buttonLabel}
                </Button>
            </div>
            {errorMessage && (
                <p className="text-error text-xs" role="alert">
                    {errorMessage}
                </p>
            )}
        </form>
    )

    return (
        <>
            <Dialog.Root
                open={isMobileDialogOpen}
                onOpenChange={(open) => {
                    setIsMobileDialogOpen(open)
                    if (open) setErrorMessage(null)
                }}
            >
                <Dialog.Trigger className="ml-auto block pr-4 text-right text-sm text-tertiary transition-colors hover:text-brand hover:underline underline-offset-2 lg:hidden">
                    {promptLabel}
                </Dialog.Trigger>
                <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-60 bg-black/65 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
                    <Dialog.Viewport className="fixed inset-0 z-60 flex items-center justify-center p-4 lg:hidden">
                        <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary p-5 text-white shadow-2xl outline-none transition-[opacity,transform] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <Dialog.Title className="text-lg font-medium text-white">{promptLabel}</Dialog.Title>
                                <Dialog.Close
                                    aria-label="Close"
                                    className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-secondary outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
                                >
                                    <IconX aria-hidden="true" size={18} />
                                </Dialog.Close>
                            </div>
                            {discountForm}
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="hidden w-full flex-col items-start space-y-2 pt-2 lg:flex">
                <button
                    type="button"
                    aria-expanded={isEditing}
                    onClick={() => {
                        setIsEditing((currentValue) => !currentValue)
                        setErrorMessage(null)
                    }}
                    className="pr-4 text-right text-sm text-tertiary transition-colors hover:text-brand hover:underline underline-offset-2"
                >
                    {promptLabel}
                </button>

                {isEditing && discountForm}
            </div>
        </>
    )
}
