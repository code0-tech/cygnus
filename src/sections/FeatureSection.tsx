import { AdapterCard } from "@/components/cards/AdapterCard"
import { ProjectCard } from "@/components/cards/ProjectCard"
import { RuntimeCard } from "@/components/cards/RuntimeCard"
import { SuggestionCard } from "@/components/cards/SuggestionCard"
import { IconArrowUpRight } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import React from "react"

export const FeatureSection: React.FC = () => {
    const t = useTranslations("FeatureSection")

    return (
        <div className={"relative overflow-hidden flex flex-col gap-16 mb-4 -mx-4"}>

            <div
                className="
                    pointer-events-none
                    absolute -inset-16
                    opacity-20 blur-lg
                    will-change-filter
                    [background:radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_45%)]
                "
            />

            <div className={"flex flex-col gap-4 items-center justify-center text-center pb-16 pt-48"}>
                <p className={"text-6xl text-white"}>
                    {t("title")}
                </p>
                <p className="relative z-10 lg:w-1/2 text-center font-medium text-white/75 text-xl">
                    {t("description")}
                </p>
                <button className={"flex items-center gap-1 border-b border-dashed border-white/25 text-sm text-white/50 hover:text-brand"}>
                    {t("linkButton")}
                    <IconArrowUpRight size={16} />
                </button>
            </div>
            <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-8 auto-rows-fr p-8"}>
                <AdapterCard/>
                <SuggestionCard/>
                <RuntimeCard/>
                <ProjectCard/>
            </div>
        </div>
    )
}
