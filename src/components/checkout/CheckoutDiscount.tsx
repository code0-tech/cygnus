"use client"

import type { CheckoutPromotionCodeSdk } from "@/lib/checkout/stripeCheckout"
import type { StripeCheckoutSession } from "@stripe/stripe-js"
import { Button, TextInput } from "@code0-tech/pictor"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { Dialog } from "@base-ui/react/dialog"
import { IconX } from "@tabler/icons-react"
import { usePathname, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

interface CheckoutDiscountProps {
    authenticated?: boolean
    appliedContainerId?: string
    appliedAmount?: string | null
    buttonLabel: string
    discountSessionRequiredError: string
    discountValidationError: string
    inputPlaceholder: string
    onApplied?: (code: string | null) => void
    checkoutRef?: RefObject<CheckoutPromotionCodeSdk | null>
    onSessionChange?: (session: StripeCheckoutSession) => void
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
    checkoutRef,
    onSessionChange,
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
    const discountRequestRef = useRef(0)
    const automaticallyAppliedCodeRef = useRef<string | null>(null)

    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

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

    const applyDiscount = useCallback(
        async (normalizedCode: string) => {
            const checkout = checkoutRef?.current
            if (!isAuthenticated || !sessionReady || !checkout) {
                setErrorMessage(discountSessionRequiredError)
                return
            }

            const requestId = ++discountRequestRef.current
            setIsApplying(true)
            setErrorMessage(null)

            try {
                const result = await checkout.applyPromotionCode(normalizedCode)
                if (!mountedRef.current || requestId !== discountRequestRef.current) return
                if (result.type === "error") throw new Error(result.error.message)
                onSessionChange?.(result.session)

                replacePromotionCode(normalizedCode)
                setCode(normalizedCode)
                setAppliedCode(normalizedCode)
                setIsEditing(false)
                setIsMobileDialogOpen(false)
                onApplied?.(normalizedCode)
            } catch (error) {
                if (!mountedRef.current || requestId !== discountRequestRef.current) return

                replacePromotionCode(null)
                setAppliedCode(null)
                onApplied?.(null)
                console.error("Failed to apply the checkout discount:", error)
                // Stripe's own message explains why a code was refused (expired, not applicable, ...).
                setErrorMessage(error instanceof Error && error.message ? error.message : discountValidationError)
            } finally {
                if (mountedRef.current && requestId === discountRequestRef.current) {
                    setIsApplying(false)
                }
            }
        },
        [discountSessionRequiredError, discountValidationError, isAuthenticated, onApplied, checkoutRef, onSessionChange, replacePromotionCode, sessionReady]
    )

    useEffect(() => {
        const promotionCode = searchParams.get("promotionCode")?.trim()

        if (!isAuthenticated || !sessionReady || !checkoutRef?.current || !promotionCode || appliedCode === promotionCode || automaticallyAppliedCodeRef.current === promotionCode) {
            return
        }

        automaticallyAppliedCodeRef.current = promotionCode
        setCode(promotionCode)
        void applyDiscount(promotionCode)
    }, [appliedCode, checkoutRef, isAuthenticated, searchParams, sessionReady, applyDiscount])

    const removeDiscount = async () => {
        if (isApplying) return
        const checkout = checkoutRef?.current
        if (!isAuthenticated || !sessionReady || !checkout) {
            setErrorMessage(discountSessionRequiredError)
            return
        }

        const requestId = ++discountRequestRef.current
        setIsApplying(true)
        setErrorMessage(null)

        try {
            const result = await checkout.removePromotionCode()
            if (!mountedRef.current || requestId !== discountRequestRef.current) return
            if (result.type === "error") throw new Error(result.error.message)
            onSessionChange?.(result.session)

            automaticallyAppliedCodeRef.current = null
            setAppliedCode(null)
            setCode("")
            setIsEditing(false)
            replacePromotionCode(null)
            onApplied?.(null)
        } catch (error) {
            if (!mountedRef.current || requestId !== discountRequestRef.current) return
            console.error("Failed to remove the checkout discount:", error)
            setErrorMessage(error instanceof Error && error.message ? error.message : discountValidationError)
        } finally {
            if (mountedRef.current && requestId === discountRequestRef.current) setIsApplying(false)
        }
    }

    const clearUnappliedDiscount = () => {
        discountRequestRef.current += 1
        automaticallyAppliedCodeRef.current = searchParams.get("promotionCode")?.trim() ?? null
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
            automaticallyAppliedCodeRef.current = searchParams.get("promotionCode")?.trim() ?? null
            setAppliedCode(null)
            replacePromotionCode(null)
            onApplied?.(null)
        }

        if (!normalizedCode) {
            clearUnappliedDiscount()
            return
        }

        void applyDiscount(normalizedCode)
    }

    if (appliedCode) {
        const appliedDiscount = (
            <div className="flex min-w-0 items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-1">
                    <span className="min-w-0 truncate text-secondary">{appliedCode}</span>
                    <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => void removeDiscount()}
                        className="shrink-0 text-tertiary transition-colors hover:text-white disabled:cursor-wait disabled:opacity-60"
                    >
                        ({removeLabel})
                    </button>
                </div>
                {appliedAmount && <span className="shrink-0 tabular-nums text-white">-{appliedAmount}</span>}
                {errorMessage && <p role="alert" className="text-error">{errorMessage}</p>}
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
