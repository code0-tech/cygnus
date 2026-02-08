import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { Section } from "@/components/Section"
import { cn } from "@/utils/cn"
import { useTranslations } from "next-intl"
import Image from "next/image"
import React from "react"

export const ContactSection: React.FC = () => {
    const t = useTranslations("ContactSection")

    return (
        <Section translationKey="ContactSection" showBlur={false} showFunnel={false}>
            <div className={"relative overflow-hidden w-full flex flex-col items-center justify-center gap-8 py-12 rounded-xl border border-white/5 shadow-xl"}>

                <InteractiveGridPattern
                    className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]")}
                    width={42}
                    height={48}
                    squares={[50, 10]}
                />
                <div className="pointer-events-none absolute inset-0 mt-8 opacity-35 blur-2xl will-change-filter [background:radial-gradient(circle_at_top,rgba(112,255,179,0.45),transparent_65%)]" />

                <div className={"z-20 size-31 border border-white/5 bg-white/5 backdrop-blur-lg flex items-center justify-center rounded-2xl"}>
                    <div className={"border border-white/10 bg-linear-to-br from-primary to-[#70ffb2]/10 flex items-center justify-center rounded-xl"}>
                        <Image src={"/code0_logo_color.png"} width={"112"} height={"112"} alt={"Code0 Logo"} className={"z-20 shadow-2xl"}/>
                    </div>
                </div>

                <p className={"z-20 text-2xl sm:text-4xl text-white text-center font-semibold"}>
                    {t("title")}
                </p>
                <p className={"w-4/5 sm:w-2/3 lg:w-1/2 z-20 text-md sm:text-lg text-white/75 text-center"}>
                    {t("description")}
                </p>

                <div className={"z-20 flex items-center gap-4"}>
                    <button className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 ring-2 ring-white/35 shadow-xl"}>
                        {t("ctaButton")}
                    </button>
                </div>
            </div>
        </Section>
    )
}
