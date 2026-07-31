import { getCheckoutContent, getFooter, getSubscriptionConfig } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent"
import { LinkButton } from "@/components/ui/LinkButton"
import { IconArrowLeft } from "@tabler/icons-react"
import { notFound } from "next/navigation"

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [checkoutContent, subscriptionConfig, footer] = await Promise.all([getCheckoutContent(locale), getSubscriptionConfig(locale), getFooter(locale)])
    const currentYear = new Date().getUTCFullYear()

    return (
        <div className="flex flex-col gap-8">
            <LinkButton href={"/subscription"} showArrow={false} className="border-0 hover:bg-white/10 pl-2.5 pr-4 py-1 rounded-[10px] hover:text-white after:hidden">
                <IconArrowLeft size={16} />
                {checkoutContent?.navigation.backLabel}
            </LinkButton>
            <CheckoutPageContent
                currentYear={currentYear}
                footer={footer}
                form={checkoutContent?.form}
                locale={locale}
                subscriptionConfig={subscriptionConfig}
                summary={checkoutContent?.summary}
            />
        </div>
    )
}
