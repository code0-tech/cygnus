"use client"

import React from "react"
import dynamic from 'next/dynamic';
import {useTranslations} from "next-intl"

const PlayerWithNoSSR = dynamic(() => import('@lottielab/lottie-player/react').then(module => module.default), {ssr: false})

export const AdapterCard: React.FC = () => {
    const t = useTranslations("FeatureSection")

    return (
        <div className={"flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-3 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <PlayerWithNoSSR
                src={'https://cdn.lottielab.com/l/7Y49BdSnCisP5m.json'}
                style={{ height: '400px', width: '400px' }}
                autoplay
                loop
            />

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("adapterTitle")}
                </p>
                <p className={"text-white/50 text-justify"}>
                    {t("adapterDescription")}
                </p>
            </div>
        </div>
    )
}
