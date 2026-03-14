import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { NodesAnimation } from "../animations/NodesAnimation"

interface NodeTabsCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function NodeCard({ locale, animationDelay = 0 }: NodeTabsCardProps) {
    const content = await getFeatureBySlug("nodes", locale)

    return (
        <FeatureCard
            className="col-span-1 md:col-span-2 row-span-3"
            contentClassName="h-full items-stretch"
            tone="pink"
            animationDelay={animationDelay}
        >
            <div className="relative z-0 flex w-full flex-1 items-start justify-center min-h-0">
                <div className="-mx-5 -mt-1 w-[calc(100%+2.5rem)] md:-mx-6 md:mt-0 md:w-[calc(100%+3rem)]">
                    <NodesAnimation />
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-primary via-primary/75 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-primary via-primary/75 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
