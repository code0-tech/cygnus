import { SubscriptionConfigurator, type SubscriptionIcons } from "@/components/SubscriptionConfigurator"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getSubscriptionConfig } from "@/lib/cms"
import { getIcon } from "@/components/IconRenderer"

export const generateMetadata = createLandingMetadata("subscription")

export default async function SubscriptionPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const subscriptionConfig = await getSubscriptionConfig(locale)
    const icons: SubscriptionIcons = {
        featureOverview: (subscriptionConfig?.featureOverview?.length
            ? subscriptionConfig.featureOverview.map((item, index) => item.icon?.trim() || ["rocket", "user-shield", "gauge"][index] || "cube")
            : ["rocket", "user-shield", "gauge"]
        ).map((icon, index) => getIcon(icon, 20, `feature-overview-${index}-${icon}`)),
        deployment: {
            selfHosted: getIcon(subscriptionConfig?.deployment?.selfHosted?.icon?.trim() || "server", 20),
            cloud: getIcon(subscriptionConfig?.deployment?.cloud?.icon?.trim() || "cloud", 20),
        },
        customerType: {
            b2b: getIcon(subscriptionConfig?.customerType?.b2b?.icon?.trim() || "briefcase-2", 20),
            b2c: getIcon(subscriptionConfig?.customerType?.b2c?.icon?.trim() || "building-store", 20),
        },
        workflowBusinessTypes: (subscriptionConfig?.workflowCalculator?.businessTypes?.length
            ? subscriptionConfig.workflowCalculator.businessTypes.map((businessType) => businessType.icon?.trim() || "building")
            : ["building"]
        ).map((icon, index) => getIcon(icon, 18, `workflow-business-type-${index}-${icon}`)),
        additionalFeatures: (subscriptionConfig?.additionalFeatures ?? []).map((feature, index) => getIcon(feature.icon?.trim() || "cube", 20, feature.id ?? `additional-feature-${index}`)),
    }

    return (
        <LandingContainer className="pt-16 sm:pt-32">{subscriptionConfig && <SubscriptionConfigurator locale={locale} content={subscriptionConfig} icons={icons} />}</LandingContainer>
    )
}
