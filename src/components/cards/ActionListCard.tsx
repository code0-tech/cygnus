import { getFeatureBySlug } from "@/utils/getFeatures"
import { type AppLocale } from "@/utils/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface ActionListCardProps {
    locale: AppLocale
}

export async function ActionListCard({ locale }: ActionListCardProps) {
    const content = await getFeatureBySlug("action-list", locale)
    
    return (
        <FeatureCard className="col-span-1 row-span-4">
            
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
