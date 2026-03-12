import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { ProjectDataTable } from "../tables/ProjectDataTable"
import { FeatureCard } from "./FeatureCard"

interface ProjectsCardProps {
    locale: AppLocale
}

export async function ProjectsCard({ locale }: ProjectsCardProps) {
    const content = await getFeatureBySlug("projects", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-3" tone="aqua">
            <ProjectDataTable/>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
