import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { ClientMemberCard } from "../ClientMemberCard"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface MemberMangementCardProps {
    locale: AppLocale
}

export async function MemberManagementCard({ locale }: MemberMangementCardProps) {
    const content = await getFeatureBySlug("member-management", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-2">
            <ClientMemberCard/>
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
