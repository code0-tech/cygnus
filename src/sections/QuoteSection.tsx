import React from "react"
import Image from "next/image"
import ScrollReveal from "@/components/ScrollReveal"
import {useTranslations} from "next-intl"

export const QuoteSection: React.FC = () => {
    const t = useTranslations("QuoteSection")

    return (
        <div className={"grid grid-cols-[20%_60%_20%] w-full py-24"}>
            <div className={""}/>

            <div className={"w-full flex flex-col gap-4 items-center justify-center pt-16 pb-8 "}>
                <ScrollReveal
                    baseOpacity={0}
                    enableBlur={true}
                    baseRotation={5}
                    blurStrength={10}
                    textClassName={"text-white/75 text-md sm:text-xl lg:text-4xl"}
                >
                    {t("quote")}
                </ScrollReveal>

                <div className={"w-full flex items-center gap-4"}>
                    <Image src={"/testimonial1.png"} alt={"Testimonial"} width={24} height={24} className={"rounded-full overflow-none aspect-square object-cover"}/>
                    <p className={"text-white/50 text-xl"}>
                        {t("author")}
                    </p>
                </div>

            </div>

            <div className={""}/>
        </div>
    )
}
