import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent"
import { createCheckoutQuery, hasCheckoutConfiguration, type CheckoutSearchParams } from "@/lib/checkout/checkoutLogin"
import { getFooter, getGlobal } from "@/lib/cms"
import { getCraterSubscriptionPrices } from "@/lib/subscription/prices.server"
import { isSupportedLocale } from "@/lib/i18n"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = { title: "Checkout" }

interface CheckoutPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<CheckoutSearchParams>
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
    const [{ locale }, query] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()
    if (!hasCheckoutConfiguration(new URLSearchParams(createCheckoutQuery(query)))) redirect(`/${locale}/subscription`)

    const [checkoutContent, subscriptionConfig, subscriptionPrices, footer, errors] = await Promise.all([
        getGlobal("checkout", locale),
        getGlobal("subscriptionConfig", locale),
        getCraterSubscriptionPrices(),
        getFooter(locale),
        getGlobal("errors", locale),
    ])
    const currentYear = new Date().getUTCFullYear()

    return (
        <div className="flex min-h-full flex-col gap-8">
            <CheckoutPageContent
                currentYear={currentYear}
                errors={errors}
                footer={footer}
                form={checkoutContent?.form}
                locale={locale}
                subscriptionConfig={subscriptionConfig}
                nextSteps={checkoutContent?.nextSteps}
                subscriptionPrices={subscriptionPrices}
                summary={checkoutContent?.summary}
            />
        </div>
    )
}
