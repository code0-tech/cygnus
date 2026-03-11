import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { ProjectDataTable } from "../tables/ProjectDataTable"
import { FeatureCard } from "./FeatureCard"

interface WelcomeUserCardProps {
    locale: AppLocale
}

export async function WelcomeUserCard({ locale }: WelcomeUserCardProps) {
    const content = await getFeatureBySlug("welcome-user", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-3" tone="aqua">
            <ProjectDataTable/>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
