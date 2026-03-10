"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { DEFAULT_DISCORD_URL, DEFAULT_GITHUB_URL, DEFAULT_INSTAGRAM_URL, DEFAULT_X_URL } from "@/lib/siteConfig"
import type { Footer } from "@/payload-types"
import { SiDiscord, SiGithub, SiInstagram, SiX } from "@icons-pack/react-simple-icons"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { useWebHaptics } from "web-haptics/react"

interface FooterSectionProps {
    locale: AppLocale
    footer: Footer | null
}

export const FooterSection: React.FC<FooterSectionProps> = ({ locale, footer }) => {
    const { trigger } = useWebHaptics()
    if (!footer?.groups) return null

    return (
        <LandingContainer className="min-h-full pt-48 pb-24 overflow-visible">
            <div className={"relative flex flex-col gap-16 overflow-hidden"}>

                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <div className="flex items-center gap-2 -ml-1.5">
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            <p className={"text-white"}>
                                {footer.company_name}
                            </p>
                        </div>
                        <div className={"flex items-center gap-4"}>
                            <Link href={DEFAULT_INSTAGRAM_URL} onClick={() => trigger("medium")} className="group">
                                <SiInstagram size={20} className={"text-white/75 group-hover:text-white"}/>
                            </Link>
                            <Link href={DEFAULT_DISCORD_URL} onClick={() => trigger("medium")} className="group">
                                <SiDiscord size={20} className={"text-white/75 group-hover:text-white"}/>
                            </Link>
                            <Link href={DEFAULT_X_URL} onClick={() => trigger("medium")} className="group">
                                <SiX size={20} className={"text-white/75 group-hover:text-white"}/>
                            </Link>
                            <Link href={DEFAULT_GITHUB_URL} onClick={() => trigger("medium")} className="group">
                                <SiGithub size={20} className={"text-white/75 group-hover:text-white"}/>
                            </Link>
                        </div>
                    </div>

                    {footer.groups.map((group) => (
                        <div className={"flex flex-col gap-2"} key={`${group.heading}-${group.id ?? "group"}`}>
                            <p className={"text-white/75"}>
                                {group.heading}
                            </p>
                            {(group.items ?? []).map((item) => (
                                <Link
                                    href={localizeHref(item.url, locale)}
                                    key={`${item.label}-${item.id ?? item.url}`}
                                    onClick={() => trigger("medium")}
                                >
                                    <p className={"text-white/50 hover:underline underline-offset-2"}>
                                        {item.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </LandingContainer>
    )
}
