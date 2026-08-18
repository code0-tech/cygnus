import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { CheckoutSuccessStatus } from "@/components/checkout/CheckoutSuccessStatus"
import { parseCheckoutSessionId } from "@/lib/checkout/checkoutReturn"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import { getCheckoutContent, getErrorsContent, getFooter, getSubscriptionConfig } from "@/lib/cms"
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

    const [checkoutContent, subscriptionConfig, footer, errors] = await Promise.all([
        getCheckoutContent(locale),
        getSubscriptionConfig(locale),
        getFooter(locale),
        getErrorsContent(locale),
    ])
    const currentYear = new Date().getUTCFullYear()
    const checkoutSearchParams = toSearchParams(query)
    const summary = buildCheckoutSuccessSummary({ checkoutContent, searchParams: checkoutSearchParams, subscriptionConfig })

    return (
        <div className="flex min-h-full flex-col gap-8">
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col gap-4 max-w-2xl text-center">
                    <div className="relative z-10 space-y-4">
                        {checkoutContent?.success && errors ? (
                            <CheckoutSuccessStatus
                                checkoutSearchParams={checkoutSearchParams}
                                content={checkoutContent.success}
                                errorMessage={errors.checkoutLicenseStatus}
                                locale={locale}
                                sessionId={checkoutSessionId}
                                summary={summary}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            <CheckoutLegalFooter className="shrink-0 justify-center pb-2" locale={locale} footer={footer} currentYear={currentYear} />
        </div>
    )
}
