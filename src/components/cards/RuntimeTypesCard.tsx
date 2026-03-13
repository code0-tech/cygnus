import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { IconTriangle } from "@tabler/icons-react"
import { SegmentedControl, SegmentedControlItem } from "@code0-tech/pictor"
import { RuntimeControlClient } from "../RuntimeControlClient"

interface RuntimeTypesCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function RuntimeTypesCard({ locale, animationDelay = 0 }: RuntimeTypesCardProps) {
    const content = await getFeatureBySlug("runtime-types", locale)

    return (
        <FeatureCard className="col-span-1 row-span-4" tone="brand" animationDelay={animationDelay}>
           <RuntimeControlClient/>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
