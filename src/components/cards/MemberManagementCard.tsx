import { ClientMemberCard } from "./ClientMemberCard"
import { FeatureCardText, type FeatureCardContent } from "../ui/FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface MemberMangementCardProps {
    content?: FeatureCardContent
    animationDelay?: number
}

export function MemberManagementCard({ content, animationDelay = 0 }: MemberMangementCardProps) {
    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-2" contentClassName="justify-between" animationDelay={animationDelay}>
            <div className="flex w-full flex-1 items-start justify-center min-h-0">
                <ClientMemberCard />
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div aria-hidden="true" className="card-bottom-fade h-40" />
        </FeatureCard>
    )
}
