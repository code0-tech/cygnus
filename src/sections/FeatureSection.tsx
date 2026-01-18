import React from "react"
import { AdapterCard } from "@/components/cards/AdapterCard"
import {ProjectCard} from "@/components/cards/ProjectCard"
import {RuntimeCard} from "@/components/cards/RuntimeCard"
import {SuggestionCard} from "@/components/cards/SuggestionCard"
import {useTranslations} from "next-intl"
import {IconArrowUpRight} from "@tabler/icons-react"

export const FeatureSection: React.FC = () => {
    const t = useTranslations("FeatureSection")

    return (
        <div className={"w-full flex flex-col gap-16 mb-4"}>
            <div className={"flex flex-col gap-4 items-center justify-center text-center py-16"}>
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
            <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-8 auto-rows-fr"}>
                <AdapterCard/>
                <SuggestionCard/>
                <RuntimeCard/>
                <ProjectCard/>
            </div>
        </div>
    )
}
