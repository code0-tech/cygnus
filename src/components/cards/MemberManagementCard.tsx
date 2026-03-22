import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { ClientMemberCard } from "./ClientMemberCard"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface MemberMangementCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function MemberManagementCard({ locale, animationDelay = 0 }: MemberMangementCardProps) {
    const content = await getFeatureBySlug("member-management", locale)

    return (
        <FeatureCard
            className="col-span-1 md:col-span-2 row-span-2"
            contentClassName="h-full items-stretch justify-between"
            animationDelay={animationDelay}
        >
            <div className="flex w-full flex-1 items-start justify-center min-h-0">
                <ClientMemberCard />
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
