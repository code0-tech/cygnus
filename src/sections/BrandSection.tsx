import React from "react"
import {useTranslations} from "next-intl"

export const BrandSection: React.FC = () => {
    const t = useTranslations('BrandSection')

    return (
        <div className={"relative w-full flex gap-8 px-8 py-24 items-center justify-between"}>
            <div
                className="absolute inset-0 -mx-4 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(-40deg,
                          rgba(255, 255, 255, 0.05) 11px,
                          rgba(255, 255, 255, 0.05) 12px,
                          transparent 12px,
                          transparent 24px
                        )
                      `,
                }}
            />
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
    )
}
