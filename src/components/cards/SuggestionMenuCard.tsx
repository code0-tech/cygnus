import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
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
        <FeatureCard
            className="col-span-1 row-span-7"
            contentClassName="h-full items-stretch justify-end"
            tone="aqua"
            animationDelay={animationDelay}
        >
            <div className="flex w-[90%] flex-1 mx-auto justify-center min-h-0 pt-2 pl-2">
                <div className="mx-auto w-full mask-[linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]">
                    <SuggesstionMenuClient />
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-40 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-160 bg-linear-to-t from-primary via-primary/75 to-transparent" />
        </FeatureCard>
    )
}
