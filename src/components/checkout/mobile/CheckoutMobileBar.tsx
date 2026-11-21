"use client"

import type { CheckoutPricing } from "@/components/checkout/summary/useCheckoutPricing"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconArrowRight } from "@tabler/icons-react"
import type { Ref } from "react"

interface CheckoutMobileBarProps {
    buttonRef?: Ref<HTMLButtonElement>
    continueLabel: string
    hidden: boolean
    includingTaxSuffix: string
    locale: AppLocale
    onContinue: () => void
    pricing: CheckoutPricing
    totalLabel: string
}

/** Fixed bottom bar below `lg` with the amount due today and the button that leads on to the checkout form. */
export function CheckoutMobileBar({ buttonRef, continueLabel, hidden, includingTaxSuffix, locale, onContinue, pricing, totalLabel }: CheckoutMobileBarProps) {
    return (
        <div
            inert={hidden || undefined}
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-primary/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none lg:hidden",
                hidden && "pointer-events-none translate-y-full"
            )}
        >
            <div className="mx-auto flex max-w-xl items-center gap-4">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-tertiary">{totalLabel}</p>
                    <p className="flex items-baseline gap-1.5">
                        <NumberFlow
                            value={pricing.totalPrice}
                            className="text-lg font-semibold tabular-nums text-brand"
                            locales={locale === "de" ? "de-DE" : "en-US"}
                            format={{ style: "currency", currency: pricing.currency.toUpperCase(), minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                        />
                        {pricing.hasTax && <span className="text-xs text-tertiary">{includingTaxSuffix}</span>}
                    </p>
                </div>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={onContinue}
                    className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-primary outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/40"
                >
                    {continueLabel}
                    <IconArrowRight aria-hidden="true" size={17} />
                </button>
            </div>
        </div>
    )
}

/** Keeps the end of the page (legal footer) clear of the fixed bar. */
export function CheckoutMobileBarSpacer() {
    return <div aria-hidden="true" className="h-[calc(5.5rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden" />
}
