import { SubscriptionConfigurator } from "@/components/SubscriptionConfigurator"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getSubscriptionConfig } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("subscription")

export default async function SubscriptionPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const subscriptionConfig = await getSubscriptionConfig(locale)

    return (
        <>
            <Aurora/>
            <LandingContainer className="pt-32">
                <SubscriptionConfigurator locale={locale} content={subscriptionConfig} />
            </LandingContainer>
        </>
    )
}
