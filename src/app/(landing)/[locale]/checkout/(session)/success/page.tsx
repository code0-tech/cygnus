import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { CheckoutSuccessStatus } from "@/components/checkout/CheckoutSuccessStatus"
import { Card } from "@/components/ui/Card"
import { LinkButton } from "@/components/ui/LinkButton"
import { getCheckoutContent, getFooter, getSubscriptionConfig } from "@/lib/cms"
import { parseCheckoutSessionId } from "@/lib/checkout/checkoutReturn"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import { isSupportedLocale } from "@/lib/i18n"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Checkout status" }

interface CheckoutSuccessPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toSearchParams(query: Record<string, string | string[] | undefined>) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        const singleValue = Array.isArray(value) ? value[0] : value
        if (singleValue !== undefined) searchParams.set(key, singleValue)
    }
    return searchParams
}

export default async function CheckoutSuccessPage({ params, searchParams }: CheckoutSuccessPageProps) {
    const [{ locale }, query] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()
    const checkoutSessionId = parseCheckoutSessionId(query.session_id)
    if (!checkoutSessionId) notFound()

    const [checkoutContent, subscriptionConfig, footer] = await Promise.all([getCheckoutContent(locale), getSubscriptionConfig(locale), getFooter(locale)])
    const currentYear = new Date().getUTCFullYear()
    const summary = buildCheckoutSuccessSummary({ checkoutContent, searchParams: toSearchParams(query), subscriptionConfig })

    return (
        <div className="flex min-h-full flex-col gap-8">
            <div className="flex flex-1 items-center justify-center">
                <Card variant={"light"} className="mx-auto max-w-2xl rounded-3xl p-8! text-center">
                    <div className="relative z-10 space-y-4">
                        {checkoutContent?.success ? <CheckoutSuccessStatus content={checkoutContent.success} locale={locale} sessionId={checkoutSessionId} summary={summary} /> : null}
                        <LinkButton href={`/${locale}`} showArrow={false} className="border-b-0">
                            {checkoutContent?.success.backToHomepageLabel}
                        </LinkButton>
                    </div>
                </Card>
            </div>
            <CheckoutLegalFooter className="shrink-0 justify-center pb-2" locale={locale} footer={footer} currentYear={currentYear} />
        </div>
    )
}
