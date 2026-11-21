"use client"

import { CheckoutForm } from "@/components/checkout/form/CheckoutForm"
import { CheckoutFormProvider } from "@/components/checkout/form/CheckoutFormProvider"
import { CheckoutMobileBar, CheckoutMobileBarSpacer } from "@/components/checkout/mobile/CheckoutMobileBar"
import { CheckoutMobileSheet } from "@/components/checkout/mobile/CheckoutMobileSheet"
import { useIsMobileCheckout } from "@/components/checkout/mobile/useMobileCheckout"
import { CheckoutLegalFooter } from "@/components/checkout/shared/CheckoutLegalFooter"
import { CheckoutSummary } from "@/components/checkout/summary/CheckoutSummary"
import { useCheckoutPricing } from "@/components/checkout/summary/useCheckoutPricing"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { Footer } from "@/payload-types"
import { IconArrowRight } from "@tabler/icons-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

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
 * Two columns from `lg` up. Below it the summary is the page, a fixed bar shows the amount due today, and the form opens
 * in a bottom sheet. The form is always mounted so the Stripe Elements load while the visitor reads the summary.
 */
function CheckoutPageLayout({ errors, form, legalFooter, locale, summaryProps }: CheckoutPageLayoutProps) {
    const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false)
    const closeMobileCheckout = useCallback(() => setMobileCheckoutOpen(false), [])
    const { hasError } = useCheckoutStage()
    const isMobile = useIsMobileCheckout()
    const pricing = useCheckoutPricing({ ...summaryProps, locale })
    const pageInert = mobileCheckoutOpen && isMobile

    useEffect(() => {
        // Shrinking a desktop window mid-checkout keeps the form in view instead of hiding it in a closed sheet.
        const desktopQuery = window.matchMedia("(min-width: 64rem)")
        let wasDesktop = desktopQuery.matches
        const handleLayoutChange = (event: MediaQueryListEvent) => {
            if (wasDesktop && !event.matches) setMobileCheckoutOpen(true)
            if (event.matches) setMobileCheckoutOpen(false)
            wasDesktop = event.matches
        }

        desktopQuery.addEventListener("change", handleLayoutChange)
        return () => desktopQuery.removeEventListener("change", handleLayoutChange)
    }, [])

    useEffect(() => {
        // The summary is hidden on errors and the message lives in the form, so it must not stay in a closed sheet.
        if (hasError) setMobileCheckoutOpen(true)
    }, [hasError])

    const openMobileCheckout = () => setMobileCheckoutOpen(true)

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
                {!hasError && (
                    <div inert={pageInert || undefined} className="contents">
                        <CheckoutSummary {...summaryProps} errors={errors} />
                    </div>
                )}
                {!pricing && (
                    <button
                        type="button"
                        onClick={openMobileCheckout}
                        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/90 px-6 text-sm font-medium text-primary outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
                    >
                        {form.continueLabel}
                        <IconArrowRight aria-hidden="true" size={17} />
                    </button>
                )}
                <CheckoutMobileSheet open={mobileCheckoutOpen} onClose={closeMobileCheckout} title={pricing?.planTitle ?? form.continueLabel} closeLabel={form.closeLabel}>
                    <CheckoutForm />
                </CheckoutMobileSheet>
            </div>

            <div inert={pageInert || undefined} className="mt-auto flex flex-col">
                {legalFooter}
                {pricing && <CheckoutMobileBarSpacer />}
            </div>

            {pricing && summaryProps.content && (
                <CheckoutMobileBar
                    continueLabel={form.continueLabel}
                    hidden={mobileCheckoutOpen}
                    includingTaxSuffix={summaryProps.content.pricing.totalIncludingTaxSuffix}
                    locale={locale}
                    onContinue={openMobileCheckout}
                    pricing={pricing}
                    totalLabel={summaryProps.content.pricing.totalDueTodayLabel}
                />
            )}
        </div>
    )
}
