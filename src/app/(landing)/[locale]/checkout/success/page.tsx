import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { getCheckoutContent, getFooter } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { LinkButton } from "@/components/ui/LinkButton"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { parseCheckoutSessionId } from "@/lib/checkout/checkoutReturn"
import type { Metadata } from "next"
import { CheckoutDraftCleanup } from "@/components/checkout/CheckoutDraftCleanup"
import { CheckoutSuccessStatus } from "@/components/checkout/CheckoutSuccessStatus"

export const metadata: Metadata = { title: "Success" }

interface CheckoutSuccessPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ checkout_started_at?: string | string[]; customer_id?: string | string[]; session_id?: string | string[] }>
}

export default async function CheckoutSuccessPage({ params, searchParams }: CheckoutSuccessPageProps) {
    const [{ locale }, query] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()
    if (!parseCheckoutSessionId(query.session_id)) notFound()

    const [checkoutContent, footer] = await Promise.all([getCheckoutContent(locale), getFooter(locale)])
    const currentYear = new Date().getUTCFullYear()
    const customerId = typeof query.customer_id === "string" && /^gid:\/\/crater\/Customer\/\d+$/.test(query.customer_id) ? query.customer_id : null
    const parsedStartedAt = typeof query.checkout_started_at === "string" ? Number(query.checkout_started_at) : Number.NaN
    const startedAt = Number.isSafeInteger(parsedStartedAt) && parsedStartedAt > 0 ? parsedStartedAt : null

    return (
        <div className="flex min-h-full flex-col gap-8">
            <CheckoutDraftCleanup />
            <div className="flex flex-1 items-center justify-center">
                <Card variant={"light"} className="mx-auto max-w-2xl rounded-3xl p-8! text-center">
                    <div className="relative z-10 space-y-4">
                        <h1 className="text-3xl font-semibold text-white">{checkoutContent?.success.heading}</h1>
                        <p className="text-secondary">{checkoutContent?.success.description}</p>
                        <div className="flex flex-col items-center justify-center gap-2">
                            {checkoutContent?.success ? <CheckoutSuccessStatus content={checkoutContent.success} customerId={customerId} locale={locale} startedAt={startedAt} /> : null}
                            <LinkButton href={`/${locale}`} showArrow={false} className="border-b-0">
                                {checkoutContent?.success.backToHomepageLabel}
                            </LinkButton>
                        </div>
                    </div>
                </Card>
            </div>
            <CheckoutLegalFooter className="shrink-0 justify-center pb-2" locale={locale} footer={footer} currentYear={currentYear} />
        </div>
    )
}
