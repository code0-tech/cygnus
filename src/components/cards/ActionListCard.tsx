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
            <div className={"pointer-events-none absolute flex -left-8 top-1/2 z-0 size-120 flex-col items-center justify-center overflow-hidden -translate-y-1/2 opacity-95"}>
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
            <FeatureCardText content={content} className="relative z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-primary/18 backdrop-blur-2xl mask-[linear-gradient(to_top,black_0%,black_50%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
