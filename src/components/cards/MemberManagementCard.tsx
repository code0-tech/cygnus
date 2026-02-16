import { getFeatureBySlug } from "@/utils/getFeatures"
import { type AppLocale } from "@/utils/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface MemberMangementCardProps {
    locale: AppLocale
}

export async function MemberManagementCard({ locale }: MemberMangementCardProps) {
    const content = await getFeatureBySlug("member-management", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-1" contentClassName="flex flex-row items-center">
            <div className="w-[70%] rounded-t-lg bg-linear-to-b from-primary to-primary/30 border border-b-0 border-white/10 p-2">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-semibold text-brand">
                        NS
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-brand">@Nico</p>
                        <p className="text-[11px] text-white/55">nico@codezero.tech</p>
                    </div>
                </div>
                <div className="mt-3 inline-flex rounded-md bg-primary ring ring-white/5">
                    <p className="text-[11px] text-white/60">Member since: 2 months ago</p>
                </div>
            </div>

            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
