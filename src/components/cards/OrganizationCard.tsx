import { type AppLocale } from "@/utils/i18n"
import { getFeatureBySlug } from "@/utils/getFeatures"
import { FeatureCard } from "./FeatureCard"
import { FeatureCardText } from "../FeatureCardText"

interface OrganizationCardProps {
    locale: AppLocale
}

export async function OrganizationCard({ locale }: OrganizationCardProps) {
    const content = await getFeatureBySlug("organizations", locale)
    const organizations = ["Cygnus Labs", "Atlas Systems", "Nova Ops", "Orion Collective", "Pulse Ventures"]

    return (
        <FeatureCard className="col-span-1 md:col-span-3 row-span-3">
            <div className="relative w-full h-full overflow-hidden pt-4 px-4">
                <div className="w-full border-b border-white/10 pb-1">
                    <div className="inline-flex items-center gap-4">
                        <div
                            className="relative pb-2 text-xs font-semibold text-white/90"
                        >
                            Created
                            <span className="absolute inset-x-0 -bottom-1px h-0.5 bg-brand" />
                        </div>
                        <div
                            className="pb-2 text-xs font-semibold text-white/50"
                        >
                            Member
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {organizations.map((organization, index) => (
                        <div
                            key={organization}
                            className="flex items-center justify-between rounded-md bg-primary px-3 py-2 ring ring-white/5"
                            style={{ opacity: 1 - index * 0.09 }}
                        >
                            <p className="text-sm text-white/80">{organization}</p>
                            <span className="h-2 w-2 rounded-full bg-blue" />
                        </div>
                    ))}
                </div>
            </div>

            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
