import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { ProjectDataTable } from "../tables/ProjectDataTable"
import { FeatureCard } from "./FeatureCard"

interface ProjectsCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function ProjectsCard({ locale, animationDelay = 0 }: ProjectsCardProps) {
    const content = await getFeatureBySlug("projects", locale)

    return (
        <FeatureCard
            className="col-span-1 md:col-span-2 row-span-3"
            contentClassName="h-full items-stretch"
            tone="aqua"
            animationDelay={animationDelay}
        >
            <div className="flex w-full flex-1 items-start justify-center min-h-0">
                <ProjectDataTable />
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-54 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
