"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { getLocaleFromPath, localizeHref } from "@/lib/i18n"
import { usePathname } from "next/navigation"

interface SectionLinkButtonProps {
    label?: string | null
    url: string
}

export function SectionLinkButton({ label, url }: SectionLinkButtonProps) {
    const locale = getLocaleFromPath(usePathname())
    return <LinkButton href={localizeHref(url, locale)}>{label}</LinkButton>
}
