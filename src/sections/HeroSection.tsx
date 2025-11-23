import React from "react"
import {useTranslations} from "next-intl"
import GradientBlinds from "@/components/GradientBlinds"
import Image from "next/image"
import { IconArrowRight } from "@tabler/icons-react"

export const HeroSection: React.FC = () => {
    const t = useTranslations('HeroSection');

    return (
        <div className="relative h-full mb-4 rounded-xl border border-white/10 overflow-hidden shadow-lg">

            <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0f0c1f]">
            <GradientBlinds
                className={"opacity-30"}
                gradientColors={['#030014', '#70ffb3']}
                angle={0}
                noise={0.3}
                blindCount={16}
                blindMinWidth={50}
                mouseDampening={0.15}
                distortAmount={0}
                spotlightRadius={0.8}
                shineDirection="left"
            />
            </div>

            <div className={"z-10 flex flex-row items-center justify-between gap-8 px-16 py-24"}>

                <div className="w-2/5 flex flex-col gap-4 text-start">
                    <div className="relative z-10 group bg-primary cursor-pointer border border-white/10 text-white shadow-md w-fit px-4 py-0.5 rounded-full flex items-center justify-between gap-1 hover:gap-2 hover:pr-3 transition-all text-sm font-medium">
                        {t("badge")}
                        <IconArrowRight size={14}/>
                    </div>

                    <h1 className="relative z-10 font-bold text-4xl text-white">
                        {t("title")}
                    </h1>

                    <p className="relative z-10 font-medium text-white/75 text-xl">
                        {t("description1")} <br/> {t("description2")}
                    </p>

                    <div className={"flex flex-col gap-4 mt-4"}>
                        <button className="h-10 z-10 flex items-center justify-center text-md gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-1 border border-white/10 shadow-md">
                            {t("docsButton")}
                        </button>
                        <button className="h-10 z-10 flex items-center justify-center text-md gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md">
                            {t("ctaButton")}
                        </button>
                    </div>
                </div>

                {/*Image*/}
                <Image src={"/code0_software.png"} alt={"Code= Example"} height={620} width={900} className={"rounded-l-xl border-l border-y border-white/10 ring-4 ring-white/5 -mr-56 shadow-xl"}/>
            </div>
        </div>
    )
}