"use client"

import { IconArrowUpRight } from "@tabler/icons-react"
import { Section as SectionDocument } from "@/payload-types"
import { getSectionByType } from "@/utils/getSectionByType"
import { getLocaleFromPath, localizeHref } from "@/utils/i18n"
import { ReactNode, useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SectionProps {
    children: ReactNode
    sectionType?: NonNullable<SectionDocument["sectionType"]>
    showBlur?: boolean
    showFunnel?: boolean
    showLinkButton?: boolean
}

export function Section({ sectionType, children, showBlur = true, showFunnel = true, showLinkButton = true }: SectionProps) {
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
        <section className={"relative overflow-hidden flex flex-col gap-16 pt-16"}>
            {showBlur &&
                <div className="pointer-events-none absolute inset-0 opacity-30 blur-xl will-change-filter [background:radial-gradient(circle,rgba(255,255,255,0.45),transparent_60%)]" />
            }
            {showFunnel &&
                <div className={"flex flex-col gap-4 items-center justify-center text-center pb-16 pt-48"}>
                    <h1 className={"text-4xl md:text-6xl text-white font-semibold"}>
                        {sectionData?.heading}
                    </h1>
                    <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                        {sectionData?.subheading}
                    </p>
                    {showLinkButton && linkUrl &&
                        <Link href={linkUrl}>
                            <Button variant="link" className="gap-1">
                                {sectionData?.link_button?.label}
                                <IconArrowUpRight size={16} />
                            </Button>
                        </Link>
                    }
                </div>
            }
            {children}
        </section>
    )
}
