"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import type { Footer } from "@/payload-types"
import { getFooter } from "@/utils/getFooter"
import { getLocaleFromPath, localizeHref } from "@/utils/i18n"
import { IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useEffect, useState } from "react"

export const FooterSection: React.FC = () => {
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)

    const [footer, setFooter] = useState<Footer | null>(null)

    useEffect(() => {
        let active = true

        const load = async () => {
            const data = await getFooter(locale)
            if (active) setFooter(data)
        }

        void load()

        return () => {
            active = false
        }
    }, [locale])

    if (!footer?.groups) return

    return (
        <LandingContainer className="min-h-full py-48">
            <div className={"relative flex flex-col gap-16 overflow-hidden"}>
                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <div className="flex items-center gap-2">
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            <p className={"text-white"}>
                                Name
                            </p>
                        </div>
                        <div className={"flex items-center gap-4"}>
                            <Link href={"https://instagram.com/code0.tech"}>
                                <IconBrandInstagram size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://discord.com/invite/vsMtqBBqC7"}>
                                <IconBrandDiscord size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://x.com"}>
                                <IconBrandX size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://github.com/code0-tech"}>
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
                                <Link href={localizeHref(item.url, locale)} key={`${item.label}-${item.id ?? item.url}`}>
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
