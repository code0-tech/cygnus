import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { ActionCircle } from "../ActionCircle"

interface ActionListCardProps {
    locale: AppLocale
}

export async function ActionListCard({ locale }: ActionListCardProps) {
    const content = await getFeatureBySlug("action-list", locale)

    return (
        <FeatureCard
            className="col-span-1 row-span-4"
            contentClassName="h-full items-start justify-end"
            tone="aqua"
        >
            <ActionCircle className="pointer-events-none absolute -left-8 top-1/2 z-0 size-120 -translate-y-1/2 opacity-95" />
            <FeatureCardText content={content} className="relative z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-primary/18 backdrop-blur-2xl [mask-image:linear-gradient(to_top,black_0%,black_50%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
