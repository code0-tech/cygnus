"use client"

import React from "react"
import {useTranslations} from "next-intl"
import {IconArrowUpRight, IconChevronDown} from "@tabler/icons-react"
import { FeatureCard } from "./FeatureCard"
import { Link } from "@/i18n/navigation"

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
                <Link href="">
                    <button className={"mt-2 flex items-center gap-1 text-xs text-white/50 hover:text-brand"}>
                        {t("featureLinkButton")}
                        <IconArrowUpRight size={16} />
                    </button>
                </Link>
            </div>

            <div className="absolute -bottom-12 -right-2 w-96 bg-linear-to-t from-primary to-[#0d1120] rounded-lg ring ring-white/10 drop-shadow-[0_65px_65px_rgba(0,0,0,0.25)]">
                <div className="flex items-center justify-between p-2 rounded-t-lg border-b border-white/10">
                    <p className="text-white/75 text-sm">Select a page</p>
                    <IconChevronDown size={20} className="text-white/75" />
                </div>
                <div className="flex flex-col px-2">
                    {dropdownItems.map((item, index) => (
                        <p key={index} className="text-white/60 p-1.5 rounded-md hover:bg-white/5 text-sm">{item}</p>
                    ))}
                </div>
            </div>
        </FeatureCard>
    )
}
