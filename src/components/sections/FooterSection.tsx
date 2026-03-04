"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import type { Footer } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX } from "@tabler/icons-react"
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
        <LandingContainer className="min-h-full py-48 overflow-visible">
            <div className={"relative flex flex-col gap-16 overflow-hidden"}>

                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <div className="flex items-center gap-2 -ml-1.5">
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            <p className={"text-white"}>
                                {footer.company_name}
                            </p>
                        </div>
                        <div className={"flex items-center gap-4"} onClick={() => trigger("medium")}>
                            <Link href={"https://instagram.com/code0.tech"}>
                                <IconBrandInstagram size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://discord.com/invite/vsMtqBBqC7"} onClick={() => trigger("medium")}>
                                <IconBrandDiscord size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://x.com"} onClick={() => trigger("medium")}>
                                <IconBrandX size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://github.com/code0-tech"} onClick={() => trigger("medium")}>
                                <IconBrandGithub size={24} className={"text-white/75"}/>
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
