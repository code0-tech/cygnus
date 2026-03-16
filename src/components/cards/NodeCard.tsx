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
            <div className="relative z-0 flex min-h-0 w-full flex-1 items-start justify-center">
                <div
                    className="-mx-5 -mt-1 w-[calc(100%+2.5rem)] md:-mx-6 md:mt-0 md:w-[calc(100%+3rem)]"
                    style={{
                        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                    }}
                >
                    <NodesAnimation />
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
