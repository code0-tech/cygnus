"use client"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"

interface CheckoutPageContentProps {
    form?: CheckoutData["form"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    summary?: CheckoutData["summary"] | null
}

export function CheckoutPageContent({ form, subscriptionConfig, summary }: CheckoutPageContentProps) {
    const { token: sessionToken } = useCraterSession()

    // TODO: Re-enable the Crater tax quote once custom plans are mapped to
    // Stripe prices and checkoutCalculateTax supports the selected plan.

    return (
        <div className="flex w-full flex-col gap-16 lg:flex-row">
            <CheckoutSummary content={summary} sessionToken={sessionToken} subscriptionConfig={subscriptionConfig} />
            <CheckoutForm content={form} subscriptionConfig={subscriptionConfig} />
        </div>
    )
}
