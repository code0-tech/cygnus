"use client"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { Footer } from "@/payload-types"

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
        <div className="flex w-full flex-col gap-16 lg:flex-row">
            <CheckoutSummary content={summary} currentYear={currentYear} footer={footer} sessionToken={sessionToken} subscriptionConfig={subscriptionConfig} />
            <CheckoutForm content={form} locale={locale} subscriptionConfig={subscriptionConfig} />
        </div>
    )
}
