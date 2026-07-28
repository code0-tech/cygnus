import { FeatureCardText, type FeatureCardContent } from "../ui/FeatureCardText"
import { SuggesstionMenuClient } from "../ui/SuggesstionMenuClient"
import { FeatureCard } from "./FeatureCard"

interface SuggestionMenuCardProps {
    content?: FeatureCardContent
    animationDelay?: number
}

export function SuggestionMenuCard({ content, animationDelay = 0 }: SuggestionMenuCardProps) {
    return (
        <FeatureCard className="col-span-1 row-span-7" contentClassName="justify-end" tone="aqua" animationDelay={animationDelay}>
            <div className="flex w-[90%] flex-1 mx-auto justify-center min-h-0 pt-2 pl-2">
                <div className="mx-auto w-full">
                    <SuggesstionMenuClient />
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-40 mt-auto w-full shrink-0 pt-4" />
            <div
                aria-hidden="true"
                className="card-bottom-fade z-30 h-88 sm:h-112 lg:h-140 xl:h-160 [background:linear-gradient(to_top,var(--color-primary)_0%,color-mix(in_oklab,var(--color-primary)_98%,transparent)_24%,color-mix(in_oklab,var(--color-primary)_92%,transparent)_46%,color-mix(in_oklab,var(--color-primary)_74%,transparent)_66%,color-mix(in_oklab,var(--color-primary)_38%,transparent)_84%,transparent_100%)]"
            />
        </FeatureCard>
    )
}
