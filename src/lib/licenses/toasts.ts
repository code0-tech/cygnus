"use client"

import { toast } from "@code0-tech/pictor"
import type { LicenseToastsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"

export type LicenseSuccessToast = Exclude<keyof LicenseToastsContent, "errorTitle">

function formatDate(value: string | null | undefined, locale: AppLocale) {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date) : null
}

export function licenseSuccessToast(content: LicenseToastsContent, message: LicenseSuccessToast, locale: AppLocale, effectiveAt?: string | null) {
    const { title, description } = content[message]
    const date = formatDate(effectiveAt, locale)

    const children = description.includes("{date}") ? (date ? description.replaceAll("{date}", date) : null) : description
    toast({ title, color: "success", ...(children ? { children } : {}) })
}

export function licenseErrorToast(content: LicenseToastsContent, message: string) {
    toast({ title: content.errorTitle, color: "error", children: message })
}
