import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { RuntimeControlClient } from "../RuntimeControlClient"

interface RuntimeTypesCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function RuntimeTypesCard({ locale, animationDelay = 0 }: RuntimeTypesCardProps) {
    const content = await getFeatureBySlug("runtime-types", locale)

    return (
        <FeatureCard
            className="col-span-1 row-span-4"
            contentClassName="h-full items-stretch justify-between"
            tone="brand"
            animationDelay={animationDelay}
        >
            <div className="relative flex w-full flex-1 items-center justify-center min-h-0 px-4 py-6">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/8 blur-3xl" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[90px]" />
                <div className="relative z-10 px-2 py-3">
                    <RuntimeControlClient />
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
