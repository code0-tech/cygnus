"use client"

import React from "react"
import {useTranslations} from "next-intl"

export const SuggestionCard: React.FC = () => {
    const t = useTranslations("FeatureSection")

    return (
        <div className={"flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-2 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("suggestionTitle")}
                </p>
                <p className={"text-white/50 text-justify"}>
                    {t("suggestionDescription")}
                </p>
            </div>
        </div>
    )
}
