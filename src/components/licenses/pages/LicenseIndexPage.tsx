"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createLicensePath } from "@/lib/licenses/licenseRoute"
import { Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

interface LicenseIndexPageProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses">
    locale: AppLocale
}

export function LicenseIndexPage({ content, locale }: LicenseIndexPageProps) {
    const router = useRouter()
    const { isSidebarLoading, sidebarLicenses } = useLicenseData()
    const latestLicense = useMemo(() => sidebarLicenses.toSorted((left, right) => (Date.parse(right.updatedAt ?? "") || 0) - (Date.parse(left.updatedAt ?? "") || 0))[0], [sidebarLicenses])

    useEffect(() => {
        if (!isSidebarLoading && latestLicense) router.replace(createLicensePath(locale, latestLicense.customerId, latestLicense.id))
    }, [isSidebarLoading, latestLicense, locale, router])

    if (isSidebarLoading || latestLicense) {
        return (
            <div role="status" aria-label={content.licenses} className="flex justify-center py-12">
                <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-brand motion-reduce:animate-none" />
            </div>
        )
    }

    return (
        <Text size="sm" hierarchy="tertiary">
            {content.emptyLicenses}
        </Text>
    )
}
