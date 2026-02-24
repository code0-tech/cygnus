import { getFeatureBySlug } from "@/utils/getFeatures"
import { type AppLocale } from "@/utils/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface NodeTabsCardProps {
    locale: AppLocale
}

export async function NodeTabsCard({ locale }: NodeTabsCardProps) {
    const content = await getFeatureBySlug("node-tabs", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-3">

            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
