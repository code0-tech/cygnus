import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { NodesAnimation } from "../animations/NodesAnimation"

interface NodeTabsCardProps {
    locale: AppLocale
}

export async function NodeCard({ locale }: NodeTabsCardProps) {
    const content = await getFeatureBySlug("nodes", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-3" tone="pink">
            <NodesAnimation/>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
