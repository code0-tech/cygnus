"use client"

import { Section as SectionDocument } from "@/payload-types"
import { getSectionByType } from "@/utils/getSectionByType"
import { getLocaleFromPath, localizeHref } from "@/utils/i18n"
import { ReactNode, useEffect, useState } from "react"
import { LinkButton } from "@/components/ui/LinkButton"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/cn"

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    sectionType?: NonNullable<SectionDocument["sectionType"]>
    showBlur?: boolean
    showFunnel?: boolean
    showLinkButton?: boolean
    fullHeight?: boolean
}

export function Section({ sectionType, children, funnelType = "center", showBlur = true, showFunnel = true, showLinkButton = true, fullHeight = false }: SectionProps) {
    const [sectionData, setSectionData] = useState<SectionDocument | null>(null)
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)
    const rawLinkUrl = sectionData?.link_button?.url?.trim()
    const linkUrl = rawLinkUrl ? localizeHref(rawLinkUrl, locale) : undefined

    useEffect(() => {
        if (!sectionType) {
            setSectionData(null)
            return
        }

        let active = true

        const loadSectionData = async () => {
            const data = await getSectionByType(sectionType, locale)
            if (active) setSectionData(data)
        }

        void loadSectionData()

        return () => {
            active = false
        }
    }, [locale, sectionType])

    return (
        <section className={cn("relative overflow-hidden flex flex-col gap-8 pt-16", fullHeight && "h-[200dvh] md:h-dvh")}>
            {showBlur &&
                <div className="pointer-events-none absolute inset-0 opacity-30 blur-xl will-change-filter [background:radial-gradient(circle,rgba(255,255,255,0.45),transparent_60%)]" />
            }
            {showFunnel && (
                funnelType === "center" ? (
                    <div className={"flex flex-col gap-4 items-center justify-center text-center"}>
                        <h1 className={"text-4xl text-white font-semibold"}>
                            {sectionData?.heading}
                        </h1>
                        <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </p>
                        {showLinkButton && linkUrl &&
                            <LinkButton href={linkUrl}>
                                {sectionData?.link_button?.label}
                            </LinkButton>
                        }
                    </div>
                ) : (
                    <div className={"flex flex-col gap-4 text-left"}>
                        <h1 className={"text-4xl text-white font-semibold"}>
                            {sectionData?.heading}
                        </h1>
                        <p className="relative z-10 max-w-[90vw] lg:w-1/2 font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </p>
                        {showLinkButton && linkUrl &&
                            <LinkButton href={linkUrl}>
                                {sectionData?.link_button?.label}
                            </LinkButton>
                        }
                    </div>
                )
            )}
            {children}
        </section>
    )
}
