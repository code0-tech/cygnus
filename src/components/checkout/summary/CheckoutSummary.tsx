"use client"

import { useOptionalCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { useCraterSession } from "@/components/checkout/session/CraterSessionProvider"
import { CheckoutPricingOverview } from "@/components/checkout/summary/CheckoutPricingOverview"
import { useCheckoutPricing } from "@/components/checkout/summary/useCheckoutPricing"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { SiteDialogContent } from "@/components/ui/SiteDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import { StableBadge } from "@/components/ui/StableBadge"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPromotionCodeSdk } from "@/lib/checkout/stripeCheckout"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import { Alert, Button, Dialog, DialogTrigger, SegmentedControl, SegmentedControlItem, TextInput } from "@code0-tech/pictor"
import type { StripeCheckoutSession } from "@stripe/stripe-js"
import { IconCircleCheck } from "@tabler/icons-react"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

interface CheckoutSummaryProps {
    checkoutPackages: CheckoutPackages
    content?: CheckoutData["summary"] | null
    errors?: ErrorsContent | null
    nextSteps?: CheckoutData["nextSteps"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
}

export function CheckoutSummary({ checkoutPackages, content, errors, nextSteps, subscriptionConfig, subscriptionPrices }: CheckoutSummaryProps) {
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale === "de" ? "de" : "en"
    const { stage } = useCheckoutStage()
    const checkoutFormState = useOptionalCheckoutFormState()
    const pricing = useCheckoutPricing({ checkoutPackages, content, locale, subscriptionConfig, subscriptionPrices })
    if (!content || !subscriptionConfig || !pricing) return null

    const nextStepsList = nextSteps
        ? [
              { title: nextSteps.step1Title, description: nextSteps.step1Description },
              { title: nextSteps.step2Title, description: nextSteps.step2Description },
              { title: nextSteps.step3Title, description: nextSteps.step3Description },
          ]
        : []

    return (
        <div className="flex-[1.34]">
            {/* Compact on phones so the plan and its price are visible without scrolling. */}
            <div className="mb-4 lg:mb-6">
                <p className="text-sm font-medium tracking-wide text-brand">{content.eyebrow}</p>
                <h2 className="mt-2 text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">{content.heading.replaceAll("{plan}", pricing.planTitle)}</h2>
                <p className="mt-3 text-sm leading-6 text-secondary max-lg:hidden">{content.description}</p>
            </div>

            <SegmentedControl
                type="single"
                color="secondary"
                disabled={stage === "payment"}
                aria-label={subscriptionConfig.paymentPeriod.label}
                className="mb-4 grid! w-full grid-cols-3! disabled:opacity-60 data-disabled:opacity-60 [&>span]:min-w-0"
                value={pricing.paymentPeriod}
                onValueChange={(value) => {
                    const option = pricing.periodOptions.find((option) => option.period === value)
                    if (option) pricing.setPaymentPeriod(option.period)
                }}
            >
                {pricing.periodOptions.map((option) => (
                    <SegmentedControlItem key={option.period} value={option.period} className="w-full! min-w-0! justify-start! px-3! py-2! text-left! text-xs! sm:text-sm!">
                        <span className="flex w-full min-w-0 flex-col items-start gap-0.5">
                            <span className="flex min-w-0 max-w-full items-center justify-start gap-2">
                                <span className="truncate text-white">{option.label}</span>
                                {option.discountBadge && (
                                    <StableBadge color="info" border className="shrink-0">
                                        {option.discountBadge}
                                    </StableBadge>
                                )}
                            </span>
                            <span className="max-w-full truncate text-xs font-normal tabular-nums text-tertiary">{option.monthlyPriceLabel}</span>
                        </span>
                    </SegmentedControlItem>
                ))}
            </SegmentedControl>

            <CheckoutPricingOverview {...pricing.overview} content={content} locale={locale} subscriptionConfig={subscriptionConfig} />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                <p className="text-tertiary">{pricing.nextChargeText}</p>
                {errors && (
                    <CheckoutDiscount
                        key={checkoutFormState?.checkoutSession?.clientSecret ?? "checkout-discount"}
                        appliedAmount={pricing.discountAmount > 0 ? pricing.formattedDiscountAmount : null}
                        appliedContainerId="checkout-applied-discount"
                        buttonLabel={content.pricing.discountButtonLabel}
                        discountSessionRequiredError={errors.discountSessionRequired}
                        discountValidationError={errors.discountValidation}
                        inputPlaceholder={content.pricing.discountInputPlaceholder}
                        checkoutRef={checkoutFormState?.stripeCheckoutRef}
                        onSessionChange={checkoutFormState?.syncStripeCheckoutSession}
                        promptLabel={content.pricing.discountPromptLabel}
                        dialogDescription={content.pricing.discountDialogDescription}
                        removeLabel={content.pricing.discountRemoveLabel}
                        sessionReady={Boolean(checkoutFormState?.selectedCustomerId && checkoutFormState.checkoutSession && checkoutFormState.stripeCheckoutReady)}
                        disabled={Boolean(checkoutFormState?.isConfirmingPayment)}
                    />
                )}
            </div>

            {nextSteps && (
                <div className="mt-8 border-t border-white/5 pt-6">
                    <h3 className="text-lg font-semibold text-white">{nextSteps.heading}</h3>
                    <ul className="mt-4 space-y-3">
                        {nextStepsList.map((step) => (
                            <li key={step.title} className="flex items-start gap-3 text-sm leading-5">
                                <IconCircleCheck aria-hidden="true" size={20} className="shrink-0 text-brand" />
                                <span className="text-secondary">
                                    <span className="font-medium text-white">{step.title}</span> {step.description}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

interface CheckoutDiscountProps {
    authenticated?: boolean
    appliedContainerId?: string
    appliedAmount?: string | null
    buttonLabel: string
    dialogDescription?: string
    disabled?: boolean
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
    dialogDescription,
    disabled = false,
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
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const isAuthenticated = authenticated ?? contextAuthenticated
    const discountRequestRef = useRef(0)
    const automaticallyAppliedCodeRef = useRef<string | null>(null)

    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
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
                setIsDialogOpen(false)
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

        if (disabled || !isAuthenticated || !sessionReady || !checkoutRef?.current || !promotionCode || appliedCode === promotionCode || automaticallyAppliedCodeRef.current === promotionCode) {
            return
        }

        automaticallyAppliedCodeRef.current = promotionCode
        setCode(promotionCode)
        void applyDiscount(promotionCode)
    }, [appliedCode, checkoutRef, disabled, isAuthenticated, searchParams, sessionReady, applyDiscount])

    const removeDiscount = async () => {
        if (isApplying || disabled) return
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
            setIsDialogOpen(false)
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
        setIsDialogOpen(false)
        replacePromotionCode(null)
        onApplied?.(null)
    }

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        const normalizedCode = code.trim()
        if (isApplying || disabled) return

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
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-1">
                    <span className="min-w-0 truncate text-secondary">{appliedCode}</span>
                    <button
                        type="button"
                        disabled={isApplying || disabled}
                        onClick={() => void removeDiscount()}
                        className="shrink-0 text-tertiary transition-colors hover:text-white disabled:cursor-wait disabled:opacity-60 max-lg:min-h-11"
                    >
                        ({removeLabel})
                    </button>
                </div>
                {appliedAmount && <span className="shrink-0 tabular-nums text-white">-{appliedAmount}</span>}
                {errorMessage && (
                    <Alert color="error" className="w-full">
                        {errorMessage}
                    </Alert>
                )}
            </div>
        )
        const appliedContainer = appliedContainerId ? document.getElementById(appliedContainerId) : null
        return appliedContainer ? createPortal(appliedDiscount, appliedContainer) : appliedDiscount
    }

    const discountForm = (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="flex flex-col items-stretch gap-3">
                <div className="min-w-0 w-full">
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
                    className="h-12! w-full! shrink-0 px-5! whitespace-nowrap lg:h-10! bg-white! hover:bg-white/90! ring-1! ring-white/20! text-sm! text-primary!"
                >
                    {isApplying ? <ButtonLoader label={buttonLabel} /> : buttonLabel}
                </Button>
            </div>
            {errorMessage && <Alert color="error">{errorMessage}</Alert>}
        </form>
    )

    return (
        <Dialog
            open={isDialogOpen && !disabled}
            onOpenChange={(open) => {
                if (open && disabled) return
                setIsDialogOpen(open)
                if (open) setErrorMessage(null)
            }}
        >
            <DialogTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className="shrink-0 text-sm font-medium text-secondary underline underline-offset-4 transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-secondary max-lg:min-h-11"
                >
                    {promptLabel}
                </button>
            </DialogTrigger>
            <SiteDialogContent compact title={promptLabel} description={dialogDescription || undefined}>
                {discountForm}
            </SiteDialogContent>
        </Dialog>
    )
}
