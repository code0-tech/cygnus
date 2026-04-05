import { SubscriptionConfigurator } from "@/components/SubscriptionConfigurator"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getSubscriptionConfig } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("subscription", locale)
}

export default async function SubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const subscriptionConfig = await getSubscriptionConfig(locale)

    return (
        <>
            <Aurora/>
            <LandingContainer className="py-[10vh]">
                <SubscriptionConfigurator locale={locale} content={subscriptionConfig} />
            </LandingContainer>
        </>
    )
}
