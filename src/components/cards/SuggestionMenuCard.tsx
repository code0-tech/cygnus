import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import type { InputSuggestion } from "@code0-tech/pictor"
import { FeatureCardText } from "../FeatureCardText"
import { SuggesstionMenuClient } from "../ui/SuggesstionMenuClient"
import { FeatureCard } from "./FeatureCard"

interface SuggestionMenuCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function SuggestionMenuCard({ locale, animationDelay = 0 }: SuggestionMenuCardProps) {
    const content = await getFeatureBySlug("suggestion-menu", locale)

    return (
        <FeatureCard className="col-span-1 row-span-7" tone="aqua" animationDelay={animationDelay}>
            <SuggesstionMenuClient />
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
