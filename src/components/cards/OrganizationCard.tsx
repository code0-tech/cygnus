import { type AppLocale } from "@/lib/i18n"
import { getFeatureBySlug } from "@/lib/cms"
import { FeatureCard } from "./FeatureCard"
import { FeatureCardText } from "../ui/FeatureCardText"
import { ClientOrganizationCard } from "./ClientOrganizationCard"

interface OrganizationCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function OrganizationCard({ locale, animationDelay = 0 }: OrganizationCardProps) {
    const content = await getFeatureBySlug("organizations", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-3 row-span-3" tone="blue" animationDelay={animationDelay}>
            <div className="flex w-full flex-1 items-start justify-center min-h-0">
                <ClientOrganizationCard />
            </div>

            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div
                aria-hidden="true"
                className="card-bottom-fade h-56 [background:linear-gradient(to_top,var(--color-primary)_0%,color-mix(in_oklab,var(--color-primary)_98%,transparent)_24%,color-mix(in_oklab,var(--color-primary)_92%,transparent)_46%,color-mix(in_oklab,var(--color-primary)_74%,transparent)_66%,color-mix(in_oklab,var(--color-primary)_38%,transparent)_84%,transparent_100%)]"
            />
        </FeatureCard>
    )
}
