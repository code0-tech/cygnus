"use client"

import { type PaymentPeriod, PAYMENT_PERIOD_OPTIONS, type SubscriptionCustomerType } from "@/lib/subscription/types"
import { useOptionalCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { useCraterSession } from "@/components/checkout/session/CraterSessionProvider"
import { CheckoutPricingOverview } from "@/components/checkout/summary/CheckoutPricingOverview"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { SiteDialogContent } from "@/components/ui/SiteDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import { StableBadge } from "@/components/ui/StableBadge"
import type { CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/client"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPromotionCodeSdk } from "@/lib/checkout/stripeCheckout"
import { formatCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, formatDiscountBadge, getMonthlyEquivalentAmount, getPaymentPeriodMonths, resolveCheckoutPricing } from "@/lib/subscription/calculator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import { Alert, Button, Dialog, DialogTrigger, SegmentedControl, SegmentedControlItem, TextInput } from "@code0-tech/pictor"
import type { StripeCheckoutSession } from "@stripe/stripe-js"
import { IconCircleCheck } from "@tabler/icons-react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

interface CheckoutSummaryProps {
    checkoutPackages: CheckoutPackages
    content?: CheckoutData["summary"] | null
    errors?: ErrorsContent | null
    nextSteps?: CheckoutData["nextSteps"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    stripePricing?: CheckoutStripePricingData | null
    taxQuote?: CheckoutTaxQuoteData | null
}

export function CheckoutSummary({ checkoutPackages, content, errors, nextSteps, stripePricing, subscriptionConfig, subscriptionPrices, taxQuote }: CheckoutSummaryProps) {
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
    const { aiTokens, paymentPeriod, plan, planTitle, pricing, workflowExecutions } = resolveCheckoutPricing({
        aiTokensParam,
        checkoutPackages,
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
    const paymentPeriodTotalPrice = pricing.totalPrice
    const previewDiscountedPrice = paymentPeriodTotalPrice
    const previewTaxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const previewTaxAmount = taxQuote ? Math.round(previewDiscountedPrice * previewTaxPercentage * 100) / 100 : 0
    const currency = stripePricing?.currency ?? "EUR"
    const promotionDiscountAmount = stripePricing?.discountAmount ?? 0
    const taxAmount = stripePricing?.taxAmount ?? previewTaxAmount
    const taxAmountInclusive = stripePricing?.taxAmountInclusive ?? 0
    const hasMixedTax = taxAmount > 0 && taxAmountInclusive > 0
    const taxPercentage = hasMixedTax ? null : stripePricing ? calculateExclusiveTaxRate(stripePricing.totalPrice, stripePricing.taxAmount) : taxQuote ? previewTaxPercentage : null
    const taxPercentageInclusive = stripePricing && !hasMixedTax ? calculateExclusiveTaxRate(stripePricing.totalPrice, taxAmountInclusive) : null
    const totalPrice = stripePricing?.totalPrice ?? previewDiscountedPrice + previewTaxAmount
    const formattedDiscountAmount = formatCurrency(promotionDiscountAmount, currency, locale)
    const includedQuantities = plan === "custom" ? { aiTokens, workflowExecutions } : checkoutPackages.planQuantities[plan]
    const deploymentTitle = deployment === "cloud" ? subscriptionConfig.deployment.cloud.title : deployment === "self_hosted" ? subscriptionConfig.deployment.selfHosted.title : null
    const customerTypeTitle = customerType === "b2b" || customerType === "b2c" ? subscriptionConfig.customerType[customerType].title : null
    const lineItemDetails = [deploymentTitle, customerTypeTitle].filter(Boolean).join(", ")
    const lineItemLabel = lineItemDetails ? `${planTitle} (${lineItemDetails})` : planTitle
    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + getPaymentPeriodMonths(paymentPeriod))
    const taxStatus = stripePricing || taxQuote ? "ready" : checkoutFormState?.checkoutSession && !checkoutFormState.stripeCheckoutReady ? "loading" : "unknown"
    const periodDateFormatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="flex-[1.34]">
            <>
                <div className="mb-6">
                    <p className="text-sm font-medium tracking-wide text-brand">{content.eyebrow}</p>
                    <h2 className="mt-2 text-3xl leading-tight font-semibold text-white sm:text-4xl">{content.heading.replaceAll("{plan}", planTitle)}</h2>
                    <p className="mt-3 text-sm leading-6 text-secondary">{content.description}</p>
                </div>

                <SegmentedControl
                    type="single"
                    color="secondary"
                    disabled={stage === "payment"}
                    aria-label={subscriptionConfig.paymentPeriod.label}
                    className="mb-4 grid! w-full grid-cols-3! disabled:opacity-60 data-disabled:opacity-60 [&>span]:min-w-0"
                    value={paymentPeriod}
                    onValueChange={(value) => {
                        const period = periodOptions.find((period) => period === value)
                        if (period) handlePeriodChange(period)
                    }}
                >
                    {periodOptions.map((period) => {
                        const { pricing: periodPricing } = resolveCheckoutPricing({
                            aiTokensParam,
                            checkoutPackages,
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

                        const monthlyPrice = getMonthlyEquivalentAmount(Math.round(periodPricing.totalPrice * 100), period) / 100

                        return (
                            <SegmentedControlItem key={period} value={period} className="w-full! min-w-0! justify-start! px-3! py-2! text-left! text-xs! sm:text-sm!">
                                <span className="flex w-full min-w-0 flex-col items-start gap-0.5">
                                    <span className="flex min-w-0 max-w-full items-center justify-start gap-2">
                                        <span className="truncate text-white">{subscriptionConfig.paymentPeriod[`${period}Text`]}</span>
                                        {discountPercentage > 0 && (
                                            <StableBadge color="info" border className="shrink-0">
                                                -{formatDiscountBadge(discountPercentage, locale)}
                                            </StableBadge>
                                        )}
                                    </span>
                                    <span className="max-w-full truncate text-xs font-normal tabular-nums text-tertiary">
                                        {formatCurrency(monthlyPrice, currency, locale)} {monthlyPeriodSuffix}
                                    </span>
                                </span>
                            </SegmentedControlItem>
                        )
                    })}
                </SegmentedControl>
            </>

            <CheckoutPricingOverview
                aiTokens={includedQuantities.aiTokens}
                billingCountry={stripePricing?.billingCountry ?? null}
                content={content}
                currency={currency}
                lineItemAmount={pricing.totalPrice}
                lineItemLabel={lineItemLabel}
                locale={locale}
                periodEnd={periodEnd}
                periodStart={periodStart}
                planDescription={subscriptionConfig.plan[plan].description}
                planTitle={planTitle}
                subscriptionConfig={subscriptionConfig}
                subtotalPrice={stripePricing?.subtotalPrice ?? pricing.totalPrice}
                taxAmount={taxAmount}
                taxAmountInclusive={taxAmountInclusive}
                taxLines={stripePricing?.taxLines ?? []}
                taxPercentage={taxPercentage}
                taxPercentageInclusive={taxPercentageInclusive}
                taxStatus={taxStatus}
                totalPrice={totalPrice}
                workflowExecutions={includedQuantities.workflowExecutions}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                <p className="text-tertiary">{content.nextChargeText.replaceAll("{date}", periodDateFormatter.format(periodEnd))}</p>
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
                        dialogDescription={content.pricing.discountDialogDescription}
                        removeLabel={content.pricing.discountRemoveLabel}
                        sessionReady={Boolean(checkoutFormState?.selectedCustomerId && checkoutFormState.checkoutSession && checkoutFormState.stripeCheckoutReady)}
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
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 text-sm">
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
                    className="h-10! w-full! shrink-0 px-5! whitespace-nowrap bg-white! hover:bg-white/90! ring-1! ring-white/20! text-sm! text-primary!"
                >
                    {isApplying ? <ButtonLoader label={buttonLabel} /> : buttonLabel}
                </Button>
            </div>
            {errorMessage && <Alert color="error">{errorMessage}</Alert>}
        </form>
    )

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (open) setErrorMessage(null)
            }}
        >
            <DialogTrigger asChild>
                <button type="button" className="shrink-0 text-sm font-medium text-secondary underline underline-offset-4 transition-colors hover:text-brand">
                    {promptLabel}
                </button>
            </DialogTrigger>
            <SiteDialogContent compact title={promptLabel} description={dialogDescription || undefined}>
                {discountForm}
            </SiteDialogContent>
        </Dialog>
    )
}
