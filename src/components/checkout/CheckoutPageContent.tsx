"use client"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { Drawer, DrawerBackdrop, DrawerClose, DrawerContent, DrawerHandle, DrawerPopup, DrawerPortal, DrawerTitle, DrawerTrigger, DrawerViewport } from "@/components/ui/Drawer"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { Footer } from "@/payload-types"
import { IconArrowRight, IconX } from "@tabler/icons-react"

interface CheckoutPageContentProps {
    currentYear: number
    footer?: Footer | null
    form?: CheckoutData["form"] | null
    locale: AppLocale
    subscriptionConfig?: SubscriptionConfigData | null
    summary?: CheckoutData["summary"] | null
}

export function CheckoutPageContent({ currentYear, footer, form, locale, subscriptionConfig, summary }: CheckoutPageContentProps) {
    const { token: sessionToken } = useCraterSession()

    // TODO: Re-enable the Crater tax quote once custom plans are mapped to
    // Stripe prices and checkoutCalculateTax supports the selected plan.

    return (
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
            <CheckoutSummary content={summary} currentYear={currentYear} footer={footer} sessionToken={sessionToken} subscriptionConfig={subscriptionConfig} />

            {form && (
                <Drawer side="bottom">
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
                                    <div className="mb-6 flex items-center justify-between gap-4">
                                        <DrawerTitle>{form.billingHeading}</DrawerTitle>
                                        <DrawerClose
                                            aria-label={locale === "de" ? "Schließen" : "Close"}
                                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-secondary outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
                                        >
                                            <IconX aria-hidden="true" size={18} />
                                        </DrawerClose>
                                    </div>
                                    <CheckoutForm content={form} locale={locale} mobileSteps showHeading={false} />
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
            )}

            <div className="hidden flex-1 lg:flex">
                <CheckoutForm content={form} locale={locale} />
            </div>
        </div>
    )
}
