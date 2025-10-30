import React from "react"
import {ChipLogo} from "@/components/ChipLogo"
import {useTranslations} from "next-intl"

export const RuntimeCard: React.FC = () => {
    const t = useTranslations("FeatureSection")

    return (
        <div className={"relative flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-2 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("runtimeTitle")}
                </p>
                <p className={"text-white/50 text-justify"}>
                    {t("runtimeDescription")}
                </p>
            </div>

        </div>
    )
}