import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { SiDiscord, SiGithub, SiNotion, SiSap, SiTelegram } from "@icons-pack/react-simple-icons"
import { OrbitingCircles } from "../animations/OrbitingCircles"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"

interface ActionListCardProps {
    locale: AppLocale
    animationDelay?: number
}

export async function ActionListCard({ locale, animationDelay = 0 }: ActionListCardProps) {
    const content = await getFeatureBySlug("action-list", locale)

    return (
        <FeatureCard
            className="col-span-1 row-span-4"
            contentClassName="h-full items-start justify-end"
            tone="aqua"
            animationDelay={animationDelay}
        >
            <div className="pointer-events-none absolute inset-x-0 top-[52%] z-0 flex -translate-y-1/2 justify-center opacity-95">
                <div className="relative size-80 scale-[0.68] sm:size-88 sm:scale-[0.8] md:size-96 md:scale-[0.88] lg:size-104 lg:scale-100">
                    <OrbitingCircles iconSize={40}>
                        <SiDiscord />
                        <SiSap />
                        <SiNotion />
                        <SiGithub />
                        <SiTelegram />
                    </OrbitingCircles>
                    <OrbitingCircles iconSize={30} radius={110} reverse speed={2}>
                        <SiDiscord />
                        <SiSap />
                        <SiNotion />
                        <SiGithub />
                        <SiTelegram />
                    </OrbitingCircles>
                </div>
            </div>
            <FeatureCardText content={content} className="relative z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-primary/18 backdrop-blur-2xl mask-[linear-gradient(to_top,black_0%,black_50%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
