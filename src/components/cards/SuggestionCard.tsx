"use client"

import React from "react"
import {useTranslations} from "next-intl"
import {IconChevronDown} from "@tabler/icons-react"

export const SuggestionCard: React.FC = () => {
    const t = useTranslations("FeatureSection")

    const dropdownItems = [
        "Dashboard",
        "Analytics",
        "Reports",
        "Settings",
        "Users",
        "Permissions",
        "Integrations",
        "API Tokens",
    ]

    return (
        <div className={"relative flex flex-col justify-start items-center overflow-hidden gap-4 p-4 h-[420px] col-span-2 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <div className={"flex flex-col gap-1 text-center"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("suggestionTitle")}
                </p>
                <p className={"text-white/50 text-sm"}>
                    {t("suggestionDescription")}
                </p>
            </div>

            <div className="absolute bottom-[-150px] right-[-150px] w-80 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
                <div className="flex items-center justify-between p-2 bg-gray-900/30 rounded-t-lg">
                    <p className="text-white/75 text-sm">Select a page</p>
                    <IconChevronDown size={20} className="text-white/75" />
                </div>
                <div className="flex flex-col p-2">
                    {dropdownItems.map((item, index) => (
                        <p key={index} className="text-white/60 p-1.5 rounded-md hover:bg-white/5 text-sm">{item}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}
