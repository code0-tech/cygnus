import { FeatureCardText, type FeatureCardContent } from "../ui/FeatureCardText"
import { RuntimeControlClient } from "../ui/RuntimeControlClient"
import { FeatureCard } from "./FeatureCard"

interface RuntimeTypesCardProps {
    content?: FeatureCardContent
    animationDelay?: number
}

export function RuntimeTypesCard({ content, animationDelay = 0 }: RuntimeTypesCardProps) {
    return (
        <FeatureCard className="col-span-1 row-span-4" contentClassName="justify-between gap-2" tone="brand" animationDelay={animationDelay}>
            <div className="relative flex w-full flex-1 items-center justify-center min-h-0 px-4 py-6">
                <RuntimeControlClient />
            </div>
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-4" />
            <div aria-hidden="true" className="card-bottom-fade h-56" />
        </FeatureCard>
    )
}
