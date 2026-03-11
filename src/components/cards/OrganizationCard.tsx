import { type AppLocale } from "@/lib/i18n"
import { getFeatureBySlug } from "@/lib/cms"
import { FeatureCard } from "./FeatureCard"
import { FeatureCardText } from "../FeatureCardText"
import { OrganizationsDataTable } from "../tables/OrganizationsDataTable"

interface OrganizationCardProps {
    locale: AppLocale
}

export async function OrganizationCard({ locale }: OrganizationCardProps) {
    const content = await getFeatureBySlug("organizations", locale)

    return (
        <FeatureCard
            className="col-span-1 md:col-span-3 row-span-3"
            contentClassName="h-full justify-between items-start"
            tone="blue"
        >
            <OrganizationsDataTable />

            <FeatureCardText content={content} className="relative z-20 mt-auto pt-6" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
