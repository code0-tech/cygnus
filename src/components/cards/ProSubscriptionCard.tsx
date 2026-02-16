import { getFeatureBySlug } from "@/utils/getFeatures"
import { AppLocale } from "@/utils/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { InteractiveGridPattern } from "../InteractiveGridPattern"
import { cn } from "@/utils/cn"

interface ProSubscriptionCardProps {
    locale: AppLocale
}

export async function ProSubscriptionCard({ locale }: ProSubscriptionCardProps) {
    const content = await getFeatureBySlug("pro-subscription", locale)

    return (
        <FeatureCard className="col-span-1 md:col-span-2 row-span-2">
            <div className="relative h-full w-[90%] mt-4 flex items-center justify-center bg-primary/20 border border-white/10 rounded-md">
                <InteractiveGridPattern
                    className={cn("mask-[radial-gradient(400px_circle_at_center,white,transparent)] opacity-10")}
                    width={32}
                    height={32}
                    squares={[15, 5]}
                />
                <div className="w-32 inline-flex items-center gap-2 rounded-full bg-brand/20 ring ring-brand/30 px-3 py-1.5">
                    <span className="h-4 w-4 rounded-full bg-brand" />
                    <p className="text-xl font-semibold font-mono uppercase tracking-[0.08em] text-brand">Pro</p>
                </div>
            </div>

            <FeatureCardText content={content}/>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
