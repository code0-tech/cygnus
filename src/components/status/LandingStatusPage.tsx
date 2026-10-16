"use client"

import { useParams } from "next/navigation"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n"
import { StatusPage, type PageErrorProps } from "./StatusPage"

function useStatusLocale() {
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale
    return locale && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
}

export function LandingNotFound() {
    return <StatusPage code="404" locale={useStatusLocale()} />
}

export function LandingError({ error, reset }: PageErrorProps) {
    return <StatusPage code="500" locale={useStatusLocale()} reference={error.digest} reset={reset} />
}
