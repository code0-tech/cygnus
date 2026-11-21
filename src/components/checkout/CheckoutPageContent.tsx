"use client"

import { CheckoutForm } from "@/components/checkout/form/CheckoutForm"
import { CheckoutFormProvider } from "@/components/checkout/form/CheckoutFormProvider"
import { CheckoutMobileBar, CheckoutMobileBarSpacer } from "@/components/checkout/mobile/CheckoutMobileBar"
import { useIsMobileCheckout } from "@/components/checkout/mobile/useMobileCheckout"
import { useMobileCheckoutView } from "@/components/checkout/mobile/useMobileCheckoutView"
import { CheckoutLegalFooter } from "@/components/checkout/shared/CheckoutLegalFooter"
import { CheckoutSummary } from "@/components/checkout/summary/CheckoutSummary"
import { useCheckoutPricing } from "@/components/checkout/summary/useCheckoutPricing"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { Footer } from "@/payload-types"
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react"
import { useEffect, useRef, type ReactNode } from "react"

interface CheckoutPageContentProps {
    checkoutPackages: CheckoutPackages
    currentYear: number
    errors?: ErrorsContent | null
    footer?: Footer | null
    form?: CheckoutData["form"] | null
    locale: AppLocale
    nextSteps?: CheckoutData["nextSteps"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    summary?: CheckoutData["summary"] | null
}

export function CheckoutPageContent({ checkoutPackages, currentYear, errors, footer, form, locale, nextSteps, subscriptionConfig, subscriptionPrices, summary }: CheckoutPageContentProps) {
    const legalFooter = <CheckoutLegalFooter className="justify-center pt-10 lg:pt-12" currentYear={currentYear} footer={footer ?? null} locale={locale} />
    const summaryProps = { checkoutPackages, content: summary, nextSteps, subscriptionConfig, subscriptionPrices }

    if (!form || !errors) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
                    <CheckoutSummary {...summaryProps} />
                </div>
                <div className="mt-auto">{legalFooter}</div>
            </div>
        )
    }

    return (
        <CheckoutFormProvider content={form} errors={errors} locale={locale}>
            <CheckoutPageLayout errors={errors} form={form} legalFooter={legalFooter} locale={locale} summaryProps={summaryProps} />
        </CheckoutFormProvider>
    )
}

interface CheckoutPageLayoutProps {
    errors: ErrorsContent
    form: CheckoutData["form"]
    legalFooter: ReactNode
    locale: AppLocale
    summaryProps: Omit<React.ComponentProps<typeof CheckoutSummary>, "errors">
}

/**
 * Two columns from `lg` up. Below it the summary and the form are two full-screen views of the same page: a fixed bar
 * with the amount due leads to the form, and a back button (or the browser back button) returns. The form is always
 * mounted, laid out but invisible on the summary view, so the Stripe Elements load while the visitor reads the summary.
 */
function CheckoutPageLayout({ errors, form, legalFooter, locale, summaryProps }: CheckoutPageLayoutProps) {
    const { hasError, stage } = useCheckoutStage()
    const isMobile = useIsMobileCheckout()
    const pricing = useCheckoutPricing({ ...summaryProps, locale })
    const { goBack, setView, showForm, view } = useMobileCheckoutView(isMobile)
    const backButtonRef = useRef<HTMLButtonElement>(null)
    const continueButtonRef = useRef<HTMLButtonElement>(null)
    const previousViewRef = useRef(view)
    const formHidden = isMobile && view === "summary"

    useEffect(() => {
        // Shrinking a desktop window mid-checkout keeps the form in view instead of jumping back to the summary.
        const desktopQuery = window.matchMedia("(min-width: 64rem)")
        let wasDesktop = desktopQuery.matches
        const handleLayoutChange = (event: MediaQueryListEvent) => {
            if (wasDesktop && !event.matches) setView("form")
            wasDesktop = event.matches
        }

        desktopQuery.addEventListener("change", handleLayoutChange)
        return () => desktopQuery.removeEventListener("change", handleLayoutChange)
    }, [setView])

    useEffect(() => {
        // Move focus with the view change, so keyboard and screen reader users land in the view they just opened.
        if (previousViewRef.current === view || !isMobile) return
        previousViewRef.current = view
        const target = view === "form" ? backButtonRef.current : continueButtonRef.current
        target?.focus({ preventScroll: true })
    }, [isMobile, view])

    const content = summaryProps.content
    const periodLabel = pricing?.periodOptions.find((option) => option.period === pricing.paymentPeriod)?.label
    // Back leads one step at a time: from payment to the billing address, from there to the summary.
    const backTargetLabel = stage === "payment" ? form.billingHeading : (content?.eyebrow ?? form.backToBillingLabel)

    return (
        <div className="flex flex-1 flex-col">
            {view === "form" && (
                <div className="sticky top-2 z-30 mb-5 lg:hidden">
                    <button
                        ref={backButtonRef}
                        type="button"
                        onClick={goBack}
                        className="flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-2xl bg-light/90 py-2.5 pr-4 pl-2.5 text-left shadow-[inset_0_1px_1px_#bfbfbf1a] outline-none backdrop-blur-md transition-colors hover:bg-light focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-secondary">
                            <IconArrowLeft size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs text-tertiary">{backTargetLabel}</span>
                            <span className="block truncate text-sm font-medium text-white">
                                {pricing?.planTitle}
                                {periodLabel && <span className="font-normal text-secondary"> · {periodLabel}</span>}
                            </span>
                        </span>
                        {pricing && (
                            <span className="shrink-0 text-right">
                                <span className="block text-base font-semibold tabular-nums text-brand">{formatCurrency(pricing.totalPrice, pricing.currency, locale)}</span>
                                {pricing.hasTax && content && <span className="block text-xs text-tertiary">{content.pricing.totalIncludingTaxSuffix}</span>}
                            </span>
                        )}
                    </button>
                </div>
            )}

            <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
                {/* Hidden, not unmounted, on the form view: an applied discount code keeps its state. */}
                {!hasError && (
                    <div className={cn("contents", view === "form" && "max-lg:hidden")}>
                        <CheckoutSummary {...summaryProps} errors={errors} />
                    </div>
                )}
                <div
                    inert={formHidden || undefined}
                    aria-hidden={formHidden || undefined}
                    className={cn(
                        "min-w-0 flex-[1.25] lg:sticky lg:top-4 lg:self-start lg:pt-7",
                        view === "summary" && "max-lg:pointer-events-none max-lg:invisible max-lg:fixed max-lg:inset-x-4 max-lg:top-0 max-lg:-z-10"
                    )}
                >
                    <CheckoutForm />
                </div>
            </div>

            <div className="mt-auto flex flex-col">
                {legalFooter}
                {view === "summary" && <CheckoutMobileBarSpacer />}
            </div>

            {pricing && content ? (
                <CheckoutMobileBar
                    buttonRef={continueButtonRef}
                    continueLabel={form.continueLabel}
                    hidden={view === "form"}
                    includingTaxSuffix={content.pricing.totalIncludingTaxSuffix}
                    locale={locale}
                    onContinue={showForm}
                    pricing={pricing}
                    totalLabel={content.pricing.totalDueTodayLabel}
                />
            ) : (
                view === "summary" && (
                    <button
                        ref={continueButtonRef}
                        type="button"
                        onClick={showForm}
                        className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-primary outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
                    >
                        {form.continueLabel}
                        <IconArrowRight aria-hidden="true" size={17} />
                    </button>
                )
            )}
        </div>
    )
}
