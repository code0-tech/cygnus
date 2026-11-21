"use client"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseCustomerPage } from "@/components/licenses/pages/LicenseCustomerPage"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createLicenseCustomerPath } from "@/lib/licenses/routes"
import { Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface LicenseIndexPageProps {
    content: LicenseContent
    locale: AppLocale
}

/**
 * A user manages a single customer, so `/licenses` is only an entry point: it forwards to that customer's page. The
 * session cookie is scoped to `/api/crater`, so the customer is only known once the dashboard data has loaded on the
 * client. Until the customer page takes over, this page shows the customer page's skeleton, so loading and forwarding
 * read as one continuous loading state. A user without a customer (before the first checkout) sees the empty state.
 */
export function LicenseIndexPage({ content, locale }: LicenseIndexPageProps) {
    const router = useRouter()
    const { customers, error, isLoading } = useLicenseData()
    const customerId = isLoading || error ? undefined : customers[0]?.id

    useEffect(() => {
        if (customerId) router.replace(createLicenseCustomerPath(locale, customerId))
    }, [customerId, locale, router])

    if (error) return null
    if (isLoading || customerId) return <LicenseCustomerPage content={content} customerId="" locale={locale} loading />

    return (
        <Text size="sm" hierarchy="tertiary">
            {content.emptyLicenses}
        </Text>
    )
}
