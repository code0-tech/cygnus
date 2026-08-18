import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent"
import { getCheckoutContent, getErrorsContent, getFooter, getSubscriptionConfig } from "@/lib/cms"
import { getCraterSubscriptionPrices } from "@/lib/craterSubscriptionPrices"
import { isSupportedLocale } from "@/lib/i18n"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Checkout" }

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [checkoutContent, subscriptionConfig, subscriptionPrices, footer, errors] = await Promise.all([
        getCheckoutContent(locale),
        getSubscriptionConfig(locale),
        getCraterSubscriptionPrices(),
        getFooter(locale),
        getErrorsContent(locale),
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
                subscriptionPrices={subscriptionPrices}
                summary={checkoutContent?.summary}
                upgradeBanner={checkoutContent?.upgradeBanner}
            />
        </div>
    )
}
