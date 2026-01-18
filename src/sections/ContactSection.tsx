import React from "react"
import {InteractiveGridPattern} from "@/components/InteractiveGridPattern"
import {cn} from "@/utils/cn"
import Image from "next/image"
import {useTranslations} from "next-intl"

export const ContactSection: React.FC = () => {
    const t = useTranslations("ContactSection")

    return (
        <div className={"relative overflow-hidden w-full flex flex-col items-center justify-center gap-8 py-12 rounded-xl ring ring-white/5 shadow-lg"}>

            <InteractiveGridPattern
                className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]")}
                width={42}
                height={48}
                squares={[50, 10]}
            />

            <div className={"z-20 size-31 border border-white/5 bg-white/5 backdrop-blur-lg flex items-center justify-center rounded-2xl"}>
                <div className={"border border-[#2d2b3b] bg-linear-to-br from-primary to-[#70ffb2]/10 flex items-center justify-center rounded-xl"}>
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
                <button className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                    {t("ctaButton")}
                </button>
            </div>

        </div>
    )
}
