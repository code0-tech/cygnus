import React from "react"
import {useTranslations} from "next-intl"
import GradientBlinds from "@/components/GradientBlinds"
import Image from "next/image"
import { IconArrowRight } from "@tabler/icons-react"
import { Section } from "@/components/Section"
import { Button } from "@/components/Button"

export const HeroSection: React.FC = () => {
    const t = useTranslations('HeroSection')

    return (
        <Section translationKey="HeroSection" showBlur={false} showFunnel={false}>

            <div className="relative h-[85vh] rounded-xl ring ring-white/5 overflow-hidden shadow-lg">

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

                <div className={"z-10 flex flex-col md:flex-row items-center justify-between gap-12 px-8 md:px-16 py-12 md:py-24"}>

                    <div className="w-full md:w-2/5 flex flex-col gap-4 text-start">
                        <div className="relative z-10 group bg-brand/5 cursor-pointer border border-brand/5 text-brand shadow-md w-fit px-4 py-0.5 rounded-full flex items-center justify-between gap-1 hover:gap-2 hover:pr-3 transition-all text-sm font-medium">
                            {t("badge")}
                            <IconArrowRight size={14}/>
                        </div>

                        <h1 className="relative z-10 font-bold text-3xl md:text-4xl text-white">
                            {t("title")}
                        </h1>

                        <p className="relative z-10 font-medium text-white/75 text-lg md:text-xl">
                            {t("description1")} <br/> {t("description2")}
                        </p>

                        <div className={"flex flex-col gap-4 mt-4"}>
                            <Button
                                variant="ghost"
                                className="w-full sm:w-auto z-10"
                            >
                                {t("docsButton")}
                            </Button>
                            <Button
                                variant="default"
                                className="w-full sm:w-auto z-10"
                            >
                                {t("ctaButton")}
                            </Button>
                        </div>
                    </div>
                    <Image src={"/code0_software.png"} alt={"Code= Example"} height={620} width={900} className={"w-full h-auto rounded-xl border border-white/10 shadow-xl md:w-4/5 md:border-0 md:border-l md:border-y md:rounded-l-xl md:rounded-r-none md:ring-4 md:ring-white/5 md:-mr-56"}/>
                </div>
            </div>
        </Section>
    )
}
