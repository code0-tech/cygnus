"use client"

import React from "react"
import {useTranslations} from "next-intl"
import {IconChevronDown} from "@tabler/icons-react"
import { FeatureCard } from "./FeatuerCard"

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
        <FeatureCard>
            <div className={"w-full flex flex-col gap-1"}>
                <p className={"font-semibold text-lg text-brand"}>
                    {t("suggestionTitle")}
                </p>
                <p className={"text-white/50 text-sm"}>
                    {t("suggestionDescription")}
                </p>
            </div>

            <div className="absolute -bottom-12 -right-2 w-96 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
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
        </FeatureCard>
    )
}
