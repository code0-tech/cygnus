import React from "react"
import {useTranslations} from "next-intl"
import { Section } from "@/components/Section"

export const BrandSection: React.FC = () => {
    const t = useTranslations('BrandSection')

    return (
        <Section translationKey="BrandSection" showBlur={false} showFunnel={false}>
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(-40deg,
                          rgba(255, 255, 255, 0.04) 11px,
                          rgba(255, 255, 255, 0.04) 12px,
                          transparent 12px,
                          transparent 24px
                        )
                      `,
                }}
            />
            <div className="w-full flex gap-8 px-8 md:px-16 items-center justify-between">
                <p className={"hidden lg:flex text-md text-white/75"}>
                    {t("title")}
                </p>
                <div className={"w-full grid grid-cols-2 md:grid-cols-4 gap-16 text-white/75 text-center"}>
                    <p className={"text-4xl font-bold"}>Logo1</p>
                    <p className={"text-4xl font-bold"}>Logo2</p>
                    <p className={"text-4xl font-bold"}>Logo3</p>
                    <p className={"text-4xl font-bold"}>Logo4</p>
                </div>
            </div>
        </Section>
    )
}
