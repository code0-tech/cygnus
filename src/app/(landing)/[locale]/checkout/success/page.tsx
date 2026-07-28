import { getCheckoutContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { LinkButton } from "@/components/ui/LinkButton"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/Card"

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const checkoutContent = await getCheckoutContent(locale)

    const heading = checkoutContent?.success.heading ?? "Payment submitted"
    const description = checkoutContent?.success.description ?? "Stripe has received your payment confirmation. You can close this page or return to the site."
    const backToHomepageLabel = checkoutContent?.success.backToHomepageLabel ?? "Return to homepage"

    return (
        <div className="min-h-[75dvh] flex items-center justify-center">
            <Card className="mx-auto max-w-2xl rounded-3xl p-8! text-center">
                <div className="relative z-10 space-y-4">
                    <h1 className="text-3xl font-semibold text-white">{heading}</h1>
                    <p className="text-secondary">{description}</p>
                    <div className="flex justify-center">
                        <LinkButton href="/" showArrow={false} className="border-b-0">
                            {backToHomepageLabel}
                        </LinkButton>
                    </div>
                </div>
            </Card>
        </div>
    )
}
