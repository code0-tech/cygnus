import React from "react"
import {useTranslations} from "next-intl"

export const HeroSection: React.FC = () => {
    const t = useTranslations('HeroSection');

    return (
        <div className="relative h-full flex flex-row items-center justify-between gap-8 rounded-xl bg-white/5 border border-white/10 px-16 py-32 overflow-hidden shadow-lg">

            <div className="w-2/5 flex flex-col gap-8 text-start">
                <div className="relative z-10 bg-primary cursor-pointer border border-white/10 text-white shadow-md w-fit px-4 py-0.5 rounded-full flex items-center gap-1 text-sm font-medium">
                    {t("badge")}
                </div>

                <h1 className="relative z-10 font-bold text-4xl text-white">
                    {t("title")}
                </h1>

                <p className="relative z-10 font-medium text-white/75 text-xl">
                    {t("description1")} <br/> {t("description2")}
                </p>

                <div className={"flex flex-col gap-4"}>
                    <button className="h-10 z-10 flex items-center justify-center text-md gap-2 bg-primary hover:bg-white/10 text-white rounded-xl px-4 py-1 border border-white/10 shadow-md">
                        {t("docsButton")}
                    </button>
                    <button className="h-10 z-10 flex items-center justify-center text-md gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md">
                        {t("ctaButton")}
                    </button>
                </div>
            </div>

            {/*Image*/}
            <div className={"h-[490px] w-[680px] -mr-16 -mb-32 bg-white/20 rounded-l-xl border border-white/10"}/>

        </div>
    )
}