"use client"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/CheckoutFormProvider"
import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { Drawer, DrawerBackdrop, DrawerContent, DrawerHandle, DrawerPopup, DrawerPortal, DrawerTrigger, DrawerViewport } from "@/components/ui/Drawer"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import type { Footer } from "@/payload-types"
import { IconArrowRight } from "@tabler/icons-react"
import { useEffect, useState, type ComponentProps } from "react"

interface CheckoutPageContentProps {
    currentYear: number
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

export function CheckoutPageContent({ currentYear, footer, form, locale, subscriptionConfig, subscriptionPrices, summary }: CheckoutPageContentProps) {
    const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 64rem)")

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

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
                {form ? (
                    <CheckoutFormProvider content={form} locale={locale}>
                        <CheckoutSummaryWithTax content={summary} errors={form.errors} subscriptionConfig={subscriptionConfig} subscriptionPrices={subscriptionPrices} />
                        {!isDesktop ? (
                            <Drawer side="bottom" open={mobileCheckoutOpen} onOpenChange={setMobileCheckoutOpen}>
                                <DrawerTrigger className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/90 px-6 text-sm font-medium text-primary outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden">
                                    {form.continueLabel}
                                    <IconArrowRight aria-hidden="true" size={17} />
                                </DrawerTrigger>
                                <DrawerPortal keepMounted>
                                    <DrawerBackdrop className="lg:hidden" />
                                    <DrawerViewport className="lg:hidden">
                                        <DrawerPopup className="max-h-[92dvh]">
                                            <DrawerHandle />
                                            <DrawerContent className="flex flex-1 flex-col overflow-hidden px-4 pt-1 pb-0 sm:px-6">
                                                <CheckoutForm mobileSteps />
                                            </DrawerContent>
                                            <CheckoutLegalFooter
                                                className="shrink-0 border-t border-white/10 bg-primary px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
                                                currentYear={currentYear}
                                                footer={footer ?? null}
                                                locale={locale}
                                            />
                                        </DrawerPopup>
                                    </DrawerViewport>
                                </DrawerPortal>
                            </Drawer>
                        ) : (
                            <div className="flex min-w-0 flex-[1.25]">
                                <CheckoutForm />
                            </div>
                        )}
                    </CheckoutFormProvider>
                ) : (
                    <CheckoutSummary content={summary} subscriptionConfig={subscriptionConfig} subscriptionPrices={subscriptionPrices} />
                )}
            </div>

            <CheckoutLegalFooter className="mt-auto hidden justify-center pt-8 lg:flex" currentYear={currentYear} footer={footer ?? null} locale={locale} />
        </div>
    )
}
