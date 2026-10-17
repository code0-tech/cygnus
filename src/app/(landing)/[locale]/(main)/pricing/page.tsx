import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage, getSubscriptionConfig } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("pricing")

export default async function PricingPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [page, subscriptionConfig] = await Promise.all([getLandingPage("pricing", locale), getSubscriptionConfig(locale)])

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={page?.layout} locale={locale} subscriptionConfig={subscriptionConfig} />
        </LandingContainer>
    )
}
