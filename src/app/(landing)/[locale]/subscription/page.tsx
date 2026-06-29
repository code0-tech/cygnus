import { SubscriptionConfigurator, type SubscriptionIcons } from "@/components/SubscriptionConfigurator"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getSubscriptionConfig } from "@/lib/cms"
import { getTablerIcon } from "@/lib/tablerIcons"

export const generateMetadata = createLandingMetadata("subscription")

export default async function SubscriptionPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const subscriptionConfig = await getSubscriptionConfig(locale)
    const icons: SubscriptionIcons = {
        featureOverview: (subscriptionConfig?.featureOverview.map((item) => item.icon) ?? ["rocket", "user-shield", "gauge"]).map((icon) => getTablerIcon(icon, 20)),
        deployment: {
            selfHosted: getTablerIcon(subscriptionConfig?.deployment.selfHosted.icon ?? "server", 20),
            cloud: getTablerIcon(subscriptionConfig?.deployment.cloud.icon ?? "cloud", 20),
        },
        customerType: {
            b2b: getTablerIcon(subscriptionConfig?.customerType.b2b.icon ?? "briefcase-2", 20),
            b2c: getTablerIcon(subscriptionConfig?.customerType.b2c.icon ?? "building-store", 20),
        },
        additionalFeatures: (subscriptionConfig?.additionalFeatures ?? []).map((feature) => getTablerIcon(feature.icon, 20)),
    }

    return (
        <>
            <Aurora/>
            <LandingContainer className="pt-32">
                <SubscriptionConfigurator locale={locale} content={subscriptionConfig} icons={icons} />
            </LandingContainer>
        </>
    )
}
