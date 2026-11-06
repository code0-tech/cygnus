import { HapticLink } from "@/components/ui/HapticLink"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { getMediaUrl } from "@/lib/media"
import type { Footer, Media } from "@/payload-types"
import { SiDiscord, SiGithub, SiInstagram, SiX } from "@icons-pack/react-simple-icons"
import { IconBrandLinkedin } from "@tabler/icons-react"
import Image from "next/image"
import React from "react"

interface FooterSectionProps {
    locale: AppLocale
    footer: Footer | null
    currentYear: number
}

const SOCIAL_ICONS = {
    instagram: SiInstagram,
    discord: SiDiscord,
    x: SiX,
    linkedin: IconBrandLinkedin,
    github: SiGithub,
} as const

export const FooterSection: React.FC<FooterSectionProps> = ({ locale, footer, currentYear }) => {
    if (!footer) return null

    const image = footer.image && typeof footer.image === "object" ? (footer.image as Media) : null
    const imageUrl = getMediaUrl(image?.url) || "/code0_text_logo_white.png"
    const imageWidth = image?.width || 150
    const imageHeight = image?.height || 150

    const legalLinks = [
        footer.legalLinks?.privacy?.url && footer.legalLinks?.privacy?.label
            ? {
                  label: footer.legalLinks.privacy.label,
                  url: footer.legalLinks.privacy.url,
              }
            : null,
        footer.legalLinks?.legalNotice?.url && footer.legalLinks?.legalNotice?.label
            ? {
                  label: footer.legalLinks.legalNotice.label,
                  url: footer.legalLinks.legalNotice.url,
              }
            : null,
        footer.legalLinks?.terms?.url && footer.legalLinks?.terms?.label
            ? {
                  label: footer.legalLinks.terms.label,
                  url: footer.legalLinks.terms.url,
              }
            : null,
    ].filter((link): link is { label: string; url: string } => Boolean(link))

    return (
        <LandingContainer className="min-h-full pt-32 pb-8 overflow-visible">
            <div className={"relative flex flex-col gap-4 overflow-visible"}>
                <div className="flex max-w-xl flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Image src={imageUrl} height={imageHeight} width={imageWidth} alt={image?.alt || "Code0 Logo"} className="h-auto w-37.5" />
                    </div>
                    {footer.description && <p className={"text-secondary pb-4"}>{footer.description}</p>}
                </div>

                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-16"}>
                    {(footer.groups ?? []).map((group) => (
                        <div className={"flex flex-col gap-1"} key={`${group.heading}-${group.id ?? "group"}`}>
                            <p className={"text-tertiary"}>{group.heading}</p>
                            {(group.items ?? []).map((item) => (
                                <HapticLink href={localizeHref(item.url, locale)} key={`${item.label}-${item.id ?? item.url}`}>
                                    <p className={"text-secondary hover:text-white hover:underline underline-offset-2 transition-colors"}>{item.label}</p>
                                </HapticLink>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="relative pt-8">
                    <div className="relative z-10 flex flex-col gap-4 text-sm text-tertiary md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-2 flex-row items-center md:gap-4">
                            {footer.contactEmail && (
                                <HapticLink href={`mailto:${footer.contactEmail}`} className="text-xs text-tertiary hover:text-white">
                                    {footer.contactEmail}
                                </HapticLink>
                            )}
                            {footer.contactEmail && <div className="h-4 w-px bg-white/10" />}
                            <div className="flex items-center gap-4">
                                {(footer.socialLinks ?? []).map((socialLink) => {
                                    const Icon = socialLink.platform ? SOCIAL_ICONS[socialLink.platform] : null
                                    if (!Icon || !socialLink.url) return null

                                    return (
                                        <HapticLink href={socialLink.url} key={`${socialLink.platform}-${socialLink.id ?? socialLink.url}`} className="group" target="_blank" rel="noreferrer">
                                            <Icon size={16} className="text-tertiary group-hover:text-white" />
                                        </HapticLink>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <p className="text-tertiary text-xs">
                                © {currentYear} {footer.company_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                {legalLinks.map((link) => (
                                    <HapticLink key={link.url} href={localizeHref(link.url, locale)}>
                                        <span className="hover:text-white hover:underline underline-offset-2">{link.label}</span>
                                    </HapticLink>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LandingContainer>
    )
}
