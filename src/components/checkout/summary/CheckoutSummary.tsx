"use client"

import { type PaymentPeriod, PAYMENT_PERIOD_OPTIONS, type SubscriptionCustomerType } from "@/lib/subscription/types"
import { useOptionalCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { useCraterSession } from "@/components/checkout/session/CraterSessionProvider"
import { CheckoutPricingOverview } from "@/components/checkout/summary/CheckoutPricingOverview"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { Switch } from "@/components/ui/Switch"
import type { CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/client"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import type { CheckoutPromotionCodeSdk } from "@/lib/checkout/stripeCheckout"
import { formatCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscription/calculator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { Button, Dialog, DialogClose, DialogContent, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, TextInput } from "@code0-tech/pictor"
import type { StripeCheckoutSession } from "@stripe/stripe-js"
import { IconX } from "@tabler/icons-react"
import { m as motion } from "motion/react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

interface CheckoutSummaryProps {
    content?: CheckoutData["summary"] | null
    errors?: ErrorsContent | null
    nextSteps?: CheckoutData["nextSteps"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    stripePricing?: CheckoutStripePricingData | null
    taxQuote?: CheckoutTaxQuoteData | null
}

export function CheckoutSummary({ content, errors, nextSteps, stripePricing, subscriptionConfig, subscriptionPrices, taxQuote }: CheckoutSummaryProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    const { stage } = useCheckoutStage()
    const checkoutFormState = useOptionalCheckoutFormState()
    if (!content || !subscriptionConfig || !subscriptionPrices) return null

    const nextStepsList = nextSteps
        ? [
              { title: nextSteps.step1Title, description: nextSteps.step1Description },
              { title: nextSteps.step2Title, description: nextSteps.step2Description },
              { title: nextSteps.step3Title, description: nextSteps.step3Description },
          ]
        : []
    const deployment = searchParams.get("deploymentType") ?? searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const periodOptions = PAYMENT_PERIOD_OPTIONS
    const handlePeriodChange = (period: PaymentPeriod) => {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.set("paymentPeriod", period)
        router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
    }
    const planParam = searchParams.get("plan")
    const paymentPeriodParam = searchParams.get("paymentPeriod")
    const workflowExecutionsParam = searchParams.get("workflowExecutions")
    const aiTokensParam = searchParams.get("aiTokens")
    const { aiTokens, isCustomPlan, paymentPeriod, periodSuffix, planPrice, planTitle, pricing, workflowExecutions } = resolveCheckoutPricing({
        aiTokensParam,
        customerTypeParam: customerType,
        deploymentTypeParam: deployment,
        fallbackPeriodSuffix: content.pricing.perMonthSuffix,
        paymentPeriodParam,
        planParam,
        subscriptionConfig,
        subscriptionPrices,
        workflowExecutionsParam,
    })
    const locale = params?.locale === "de" ? "de" : "en"
    const monthlyPeriodSuffix = subscriptionConfig?.paymentPeriod.monthlyPeriodSuffix ?? content.pricing.perMonthSuffix
    const paymentPeriodDiscountAmount = Math.max(0, pricing.totalBeforeDiscount - pricing.totalPrice)
    const paymentPeriodDiscountPercentage = pricing.totalBeforeDiscount > 0 ? paymentPeriodDiscountAmount / pricing.totalBeforeDiscount : 0
    const paymentPeriodDiscountLabel = paymentPeriod === "quarterly" ? content.pricing.quarterlyDiscountLabel : paymentPeriod === "yearly" ? content.pricing.yearlyDiscountLabel : null
    const paymentPeriodTotalPrice = pricing.totalPrice
    const previewDiscountedPrice = paymentPeriodTotalPrice
    const previewTaxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const previewTaxAmount = taxQuote ? Math.round(previewDiscountedPrice * previewTaxPercentage * 100) / 100 : 0
    const currency = stripePricing?.currency ?? "EUR"
    const promotionDiscountAmount = stripePricing?.discountAmount ?? 0
    const taxAmount = stripePricing?.taxAmount ?? previewTaxAmount
    const taxPercentage = stripePricing ? calculateExclusiveTaxRate(stripePricing.totalPrice, stripePricing.taxAmount) : taxQuote ? previewTaxPercentage : null
    const totalPrice = stripePricing?.totalPrice ?? previewDiscountedPrice + previewTaxAmount
    const formattedDiscountAmount = formatCurrency(promotionDiscountAmount, currency, locale)

    return (
        <div className="flex-[1.34]">
            {stage === "payment" ? (
                nextSteps ? (
                    <div className="mb-6">
                        <h2 className="text-2xl text-white">{nextSteps.heading}</h2>
                        <ol className="relative mt-4 space-y-6">
                            <div aria-hidden="true" className="pointer-events-none absolute left-3 top-2 h-[calc(100%-1.5rem)] w-px bg-linear-to-b from-white/20 via-white/10 to-transparent" />
                            {nextStepsList.map((step, index) => (
                                <motion.li
                                    key={step.title}
                                    className="relative flex items-center gap-4"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.15, ease: "easeOut" }}
                                >
                                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-primary text-xs font-semibold text-white">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{step.title}</p>
                                        <p className="text-sm text-secondary">{step.description}</p>
                                    </div>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                ) : null
            ) : (
                <>
                    <div className="mb-6">
                        <p className="tracking-wide text-brand">{content.eyebrow}</p>
                        <h2 className="mt-4 text-2xl text-white">{content.heading}</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">{content.description}</p>
                    </div>

                    {subscriptionConfig && (
                        <Switch
                            variant="pictor"
                            className="mt-4 mb-2 text-sm"
                            value={paymentPeriod}
                            options={periodOptions.map((period) => {
                                const { pricing: periodPricing } = resolveCheckoutPricing({
                                    aiTokensParam,
                                    customerTypeParam: customerType,
                                    deploymentTypeParam: deployment,
                                    fallbackPeriodSuffix: content.pricing.perMonthSuffix,
                                    paymentPeriodParam: period,
                                    planParam,
                                    subscriptionConfig,
                                    subscriptionPrices,
                                    workflowExecutionsParam,
                                })

                                const discountAmount = Math.max(0, periodPricing.totalBeforeDiscount - periodPricing.totalPrice)

                                const discountPercentage = periodPricing.totalBeforeDiscount > 0 ? discountAmount / periodPricing.totalBeforeDiscount : 0

                                return {
                                    value: period,
                                    label: subscriptionConfig.paymentPeriod[`${period}Text`],
                                    badge: discountPercentage > 0 ? `-${formatDiscountBadge(discountPercentage, locale)}` : null,
                                }
                            })}
                            onChange={handlePeriodChange}
                        />
                    )}
                </>
            )}

            <CheckoutPricingOverview
                aiTokenPrice={pricing.aiTokenPrice}
                aiTokens={aiTokens}
                content={content}
                currency={currency}
                customerType={customerType}
                deployment={deployment}
                isCustomPlan={isCustomPlan}
                locale={locale}
                monthlyPeriodSuffix={monthlyPeriodSuffix}
                paymentPeriodDiscountAmount={paymentPeriodDiscountAmount}
                paymentPeriodDiscountLabel={paymentPeriodDiscountLabel}
                paymentPeriodDiscountPercentage={paymentPeriodDiscountPercentage}
                periodSuffix={periodSuffix}
                planPrice={planPrice}
                planTitle={planTitle}
                subscriptionConfig={subscriptionConfig}
                taxAmount={taxAmount}
                taxPercentage={taxPercentage}
                totalPrice={totalPrice}
                workflowExecutionPrice={pricing.workflowExecutionPrice}
                workflowExecutions={workflowExecutions}
            />

            {errors && (
                <CheckoutDiscount
                    key={checkoutFormState?.checkoutSession?.clientSecret ?? "checkout-discount"}
                    appliedAmount={promotionDiscountAmount > 0 ? formattedDiscountAmount : null}
                    appliedContainerId="checkout-applied-discount"
                    buttonLabel={content.pricing.discountButtonLabel}
                    discountSessionRequiredError={errors.discountSessionRequired}
                    discountValidationError={errors.discountValidation}
                    inputPlaceholder={content.pricing.discountInputPlaceholder}
                    checkoutRef={checkoutFormState?.stripeCheckoutRef}
                    onSessionChange={checkoutFormState?.syncStripeCheckoutSession}
                    promptLabel={content.pricing.discountPromptLabel}
                    removeLabel={content.pricing.discountRemoveLabel}
                    sessionReady={Boolean(checkoutFormState?.selectedCustomerId && checkoutFormState.checkoutSession && checkoutFormState.stripeCheckoutReady)}
                />
            )}
        </div>
    )
}

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
                {errorMessage && (
                    <p role="alert" className="text-error">
                        {errorMessage}
                    </p>
                )}
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
            <Dialog
                open={isMobileDialogOpen}
                onOpenChange={(open) => {
                    setIsMobileDialogOpen(open)
                    if (open) setErrorMessage(null)
                }}
            >
                <DialogTrigger asChild>
                    <button type="button" className="ml-auto block pr-4 text-right text-sm text-tertiary transition-colors hover:text-brand hover:underline underline-offset-2 lg:hidden">
                        {promptLabel}
                    </button>
                </DialogTrigger>
                <DialogPortal>
                    <DialogOverlay className="backdrop-blur-sm lg:hidden" />
                    <DialogContent className="w-[calc(100vw-2rem)]! max-w-sm! border border-white/10 bg-primary! p-5! text-white lg:hidden">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-medium text-white">{promptLabel}</DialogTitle>
                            </DialogHeader>
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-secondary outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
                                >
                                    <IconX aria-hidden="true" size={18} />
                                </button>
                            </DialogClose>
                        </div>
                        {discountForm}
                    </DialogContent>
                </DialogPortal>
            </Dialog>

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
