import { getFeatureBySlug } from "@/utils/getFeatures"
import { type AppLocale } from "@/utils/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import Image from "next/image"

interface TeamSubscriptionCardProps {
    locale: AppLocale
}

export async function TeamSubscriptionCard({ locale }: TeamSubscriptionCardProps) {
    const content = await getFeatureBySlug("team-subscription", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-1 row-span-1">
            <div className="w-full flex items-center gap-2 p-3 bg-primary/20 ring ring-white/5 rounded-md">
                {/* CodeZero Logo here !!! */}
                <div className="w-full inline-flex items-center gap-2 rounded-full bg-yellow/20 ring ring-yellow/30 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-yellow" />
                    <p className="text-xs font-semibold font-mono uppercase tracking-[0.08em] text-yellow">Team</p>
                </div>
            </div>

            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
