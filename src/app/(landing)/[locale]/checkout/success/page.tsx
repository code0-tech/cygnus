import { CheckoutLegalFooter } from "@/components/checkout/CheckoutLegalFooter"
import { getCheckoutContent, getFooter } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { LinkButton } from "@/components/ui/LinkButton"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { parseCheckoutSessionId } from "@/lib/checkout/checkoutReturn"

interface CheckoutSuccessPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ session_id?: string | string[] }>
}

export default async function CheckoutSuccessPage({ params, searchParams }: CheckoutSuccessPageProps) {
    const [{ locale }, query] = await Promise.all([params, searchParams])
    if (!isSupportedLocale(locale)) notFound()
    if (!parseCheckoutSessionId(query.session_id)) notFound()

    const [checkoutContent, footer] = await Promise.all([getCheckoutContent(locale), getFooter(locale)])

    const heading = checkoutContent?.success.heading ?? "Payment submitted"
    const description = checkoutContent?.success.description ?? "Stripe has received your payment confirmation. You can close this page or return to the site."
    const backToHomepageLabel = checkoutContent?.success.backToHomepageLabel ?? "Return to homepage"
    const currentYear = new Date().getUTCFullYear()

    // This page is only a return confirmation. Subscription and license state
    // remains exclusively driven by Crater's verified Stripe webhooks.

    return (
        <div className="flex min-h-full flex-col gap-8">
            <div className="flex flex-1 items-center justify-center">
                <Card variant={"light"} className="mx-auto max-w-2xl rounded-3xl p-8! text-center">
                    <div className="relative z-10 space-y-4">
                        <h1 className="text-3xl font-semibold text-white">{heading}</h1>
                        <p className="text-secondary">{description}</p>
                        <div className="flex justify-center">
                            <LinkButton href={`/${locale}`} showArrow={false} className="border-b-0">
                                {backToHomepageLabel}
                            </LinkButton>
                        </div>
                    </div>
                </Card>
            </div>
            <CheckoutLegalFooter className="shrink-0 justify-center pb-2" locale={locale} footer={footer} currentYear={currentYear} />
        </div>
    )
}
