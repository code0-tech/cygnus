import { FeatureCardText, type FeatureCardContent } from "../ui/FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { NodesAnimation } from "../animations/NodesAnimation"

interface NodeTabsCardProps {
    content?: FeatureCardContent
    animationDelay?: number
}

export function NodeCard({ content, animationDelay = 0 }: NodeTabsCardProps) {
    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-4 md:row-span-3" tone="pink" animationDelay={animationDelay}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-4 z-0 flex items-start justify-center overflow-hidden lg:top-8 2xl:top-16">
                <div
                    className="-mx-5 w-[calc(100%+2.5rem)] md:-mx-6 md:w-[calc(100%+3rem)]"
                    style={{
                        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                    }}
                >
                    <NodesAnimation />
                </div>
            </div>
            <div className="relative z-10 flex min-h-0 w-full flex-1" />
            <FeatureCardText content={content} className="relative z-20 mt-auto w-full shrink-0 pt-5" />
            <div aria-hidden="true" className="card-bottom-fade h-40" />
        </FeatureCard>
    )
}
