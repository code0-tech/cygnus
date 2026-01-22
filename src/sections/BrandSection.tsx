import React from "react"
import {useTranslations} from "next-intl"

export const BrandSection: React.FC = () => {
    const t = useTranslations('BrandSection')

    return (
        <div className={"relative overflow-hidden -mx-4 py-24"}>
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
            <div className="w-full flex gap-8 px-8 items-center justify-between">
                <p className={"text-md text-white/75"}>
                    {t("title")}
                </p>
                <div className={"w-full flex items-center justify-between gap-4 lg:gap-24 text-white/75"}>
                    <p className={"text-4xl font-bold"}>Logo1</p>
                    <p className={"text-4xl font-bold"}>Logo2</p>
                    <p className={"text-4xl font-bold"}>Logo3</p>
                    <p className={"text-4xl font-bold"}>Logo4</p>
                </div>
            </div>
        </div>
    )
}
