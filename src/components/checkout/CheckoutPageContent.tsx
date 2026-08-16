"use client"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/CheckoutFormProvider"
import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import { cn } from "@/lib/utils"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import type { Footer } from "@/payload-types"
import { IconArrowRight } from "@tabler/icons-react"
import { useEffect, useState, type ComponentProps } from "react"

interface CheckoutPageContentProps {
    currentYear: number
    errors?: ErrorsContent | null
    footer?: Footer | null
    form?: CheckoutData["form"] | null
    locale: AppLocale
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    summary?: CheckoutData["summary"] | null
}

function CheckoutSummaryWithTax(props: Omit<ComponentProps<typeof CheckoutSummary>, "taxQuote">) {
    const { taxQuote } = useCheckoutFormState()
    return <CheckoutSummary {...props} taxQuote={taxQuote} />
}

export function CheckoutPageContent({ currentYear, errors, footer, form, locale, subscriptionConfig, subscriptionPrices, summary }: CheckoutPageContentProps) {
    const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false)
    const { hasError } = useCheckoutStage()

    useEffect(() => {
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
        if (!mobileCheckoutOpen) return

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileCheckoutOpen(false)
        }

        window.addEventListener("keydown", closeOnEscape)
        return () => window.removeEventListener("keydown", closeOnEscape)
    }, [mobileCheckoutOpen])

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
                {form && errors ? (
                    <CheckoutFormProvider content={form} errors={errors} locale={locale}>
                        {!hasError && <CheckoutSummaryWithTax content={summary} errors={errors} subscriptionConfig={subscriptionConfig} subscriptionPrices={subscriptionPrices} />}
                        <button
                            type="button"
                            onClick={() => setMobileCheckoutOpen(true)}
                            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/90 px-6 text-sm font-medium text-primary outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
                        >
                            {form.continueLabel}
                            <IconArrowRight aria-hidden="true" size={17} />
                        </button>
                        <div
                            className={cn(
                                "min-w-0 flex-[1.25] lg:relative lg:flex",
                                "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:flex max-lg:items-end max-lg:justify-center",
                                mobileCheckoutOpen ? "max-lg:visible" : "max-lg:pointer-events-none max-lg:invisible"
                            )}
                        >
                            <button
                                type="button"
                                aria-label={form.backToBillingLabel}
                                onClick={() => setMobileCheckoutOpen(false)}
                                className={cn(
                                    "fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
                                    mobileCheckoutOpen ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <div
                                role={mobileCheckoutOpen ? "dialog" : undefined}
                                aria-modal={mobileCheckoutOpen || undefined}
                                aria-label={form.continueLabel}
                                className={cn(
                                    "pointer-events-auto relative flex max-h-[92dvh] w-full min-h-0 flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-primary text-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                                    "lg:max-h-none lg:flex-1 lg:translate-y-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none",
                                    mobileCheckoutOpen ? "translate-y-0" : "translate-y-full"
                                )}
                            >
                                <div aria-hidden="true" className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-white/20 lg:hidden" />
                                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-1 pb-0 sm:px-6 lg:overflow-visible lg:p-0">
                                    <CheckoutForm />
                                </div>
                            </div>
                        </div>
                    </CheckoutFormProvider>
                ) : (
                    <CheckoutSummary content={summary} subscriptionConfig={subscriptionConfig} subscriptionPrices={subscriptionPrices} />
                )}
            </div>

            <CheckoutLegalFooter className="mt-auto justify-center pt-8" currentYear={currentYear} footer={footer ?? null} locale={locale} />
        </div>
    )
}
