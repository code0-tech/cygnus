import { type AppLocale } from "@/lib/i18n"
import { getFeatureBySlug } from "@/lib/cms"
import { FeatureCard } from "./FeatureCard"
import { FeatureCardText } from "../FeatureCardText"

interface WelcomeUserCardProps {
    locale: AppLocale
}

export async function WelcomeUserCard({ locale }: WelcomeUserCardProps) {
    const content = await getFeatureBySlug("welcome-user", locale)

    const projects = [
        "Cygnus Platform",
        "Orion Team Space",
        "Atlas API Runtime",
        "Nova Billing",
        "Pulse Analytics",
    ]

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-3" tone="aqua">
            <div className="relative w-[90%] mt-4 h-full overflow-hidden pt-4 px-4 bg-linear-to-b from-primary to-primary/50 rounded-t-lg border border-b-0 border-white/10">
                <p className="mb-4 text-lg font-semibold text-gray-300">Welcome @Nico</p>

                <div className="mt-4 pb-4 space-y-2 opacity-85">
                    {projects.map((project, index) => (
                        <div
                            key={project}
                            className="flex items-center justify-between px-3 py-2 border-b border-white/10"
                            style={{ opacity: 1 - index * 0.12 }}
                        >
                            <p className="text-sm text-white/75">{project}</p>
                            <span className="h-2 w-2 rounded-full bg-brand/80" />
                        </div>
                    ))}
                </div>

            </div>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
