"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import type { Footer } from "@/payload-types"
import { SiDiscord, SiGithub, SiInstagram, SiX } from "@icons-pack/react-simple-icons"
import { IconBrandLinkedin } from "@tabler/icons-react"
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
    if (!footer) return null

    const socialIcons = {
        instagram: SiInstagram,
        discord: SiDiscord,
        x: SiX,
        linkedin: IconBrandLinkedin,
        github: SiGithub,
    } as const
    const legalLinks = [
        footer.legalLinks?.privacy?.url && footer.legalLinks?.privacy?.label
            ? { label: footer.legalLinks.privacy.label, url: footer.legalLinks.privacy.url }
            : null,
        footer.legalLinks?.legalNotice?.url && footer.legalLinks?.legalNotice?.label
            ? { label: footer.legalLinks.legalNotice.label, url: footer.legalLinks.legalNotice.url }
            : null,
    ].filter((link): link is { label: string; url: string } => Boolean(link))

    return (
        <LandingContainer className="min-h-full pt-32 pb-4 overflow-visible">
            <div className={"relative flex flex-col gap-4 overflow-hidden"}>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-4"}>
                    {(footer.groups ?? []).map((group) => (
                        <div className={"flex flex-col gap-1"} key={`${group.heading}-${group.id ?? "group"}`}>
                            <p className={"text-white font-medium"}>
                                {group.heading}
                            </p>
                            {(group.items ?? []).map((item) => (
                                <Link
                                    href={localizeHref(item.url, locale)}
                                    key={`${item.label}-${item.id ?? item.url}`}
                                    onClick={() => trigger("medium")}
                                >
                                    <p className={"text-white/50 hover:text-white/80 hover:underline underline-offset-2"}>
                                        {item.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="h-px w-full bg-white/10" />

                <div className="py-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex max-w-xl flex-col gap-2">
                        <div className="flex items-start gap-2">
                            <Image src={"/code0_text_logo_white.png"} height={"150"} width={"150"} alt={"Code0 Logo"} className="-mt-1.25" />
                        </div>
                        {footer.description && (
                            <p className={"text-white/50 text-sm"}>
                                {footer.description}
                            </p>
                        )}
                    </div>

                    <div className={"flex items-center gap-4"}>
                        {footer.contactEmail && (
                            <>
                            <Link
                                href={`mailto:${footer.contactEmail}`}
                                onClick={() => trigger("medium")}
                                className={"text-white/75 hover:text-white text-sm"}
                            >
                                {footer.contactEmail}
                                </Link>
                                <div className="h-5 w-px bg-white/10"/>
                            </>
                        )}
                        {(footer.socialLinks ?? []).map((socialLink) => {
                            const Icon = socialLink.platform ? socialIcons[socialLink.platform] : null
                            if (!Icon || !socialLink.url) return null

                            return (
                                <Link
                                    href={socialLink.url}
                                    key={`${socialLink.platform}-${socialLink.id ?? socialLink.url}`}
                                    onClick={() => trigger("medium")}
                                    className="group"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Icon size={20} className={"text-white/75 group-hover:text-white"} />
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="h-px w-full bg-white/10" />

                <div className="flex flex-col gap-4 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-8 text-xs">
                        {legalLinks.map((link) => (
                            <Link key={link.url} href={localizeHref(link.url, locale)} onClick={() => trigger("medium")}>
                                <span className={"hover:text-white hover:underline underline-offset-2"}>
                                    {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <p className="text-white/50 text-xs">
                        © {new Date().getFullYear()} {footer.company_name}
                    </p>
                </div>
            </div>
        </LandingContainer>
    )
}
