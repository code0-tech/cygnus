"use client"

import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import type { LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import { Button, Flex, Text } from "@code0-tech/pictor"
import { IconArrowAutofitLeftFilled, IconKey, IconLayoutDashboard } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses" | "redirectUrl" | "sidebar">
    isLoading: boolean
    locale: AppLocale
    licenses: LicenseDashboardLicense[]
}

function formatLicenseValue(value?: string) {
    if (!value) return undefined

    return value
        .replaceAll("_", " ")
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function getShortLicenseId(id: string) {
    const identifier = id.split("/").at(-1)?.trim()
    return `#${identifier || id.slice(-6)}`
}

function LicenseSidebarSkeleton() {
    return (
        <ul aria-hidden="true" className="space-y-1.5">
            {Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="flex animate-pulse items-center gap-3 rounded-xl px-2 py-2 motion-reduce:animate-none">
                    <span className="size-[18px] shrink-0 rounded bg-white/10" />
                    <span className="min-w-0 flex-1">
                        <span className="flex h-5 items-center">
                            <span className={index === 1 ? "block h-3 w-24 rounded-full bg-white/10" : "block h-3 w-32 rounded-full bg-white/10"} />
                        </span>
                        <span className="flex h-4 items-center">
                            <span className="block h-2.5 w-36 rounded-full bg-white/[0.07]" />
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    )
}

export function LicenseSidebar({ content, isLoading, locale, licenses }: LicenseSidebarProps) {
    const pathname = usePathname()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const dashboardHref = `/${locale}/licenses`
    const dashboardIsActive = pathname === dashboardHref || pathname === `${dashboardHref}/`

    const logout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            await fetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
        } finally {
            window.location.replace(content.redirectUrl)
        }
    }

    return (
        <aside className="flex min-h-0 flex-col bg-light backdrop-blur-xl lg:h-full pr-4">
            <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60 p-2">
                <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
            </Link>

            <nav aria-label={content.sidebar.dashboard} className="mt-8">
                <Link
                    href={dashboardHref}
                    aria-current={dashboardIsActive ? "page" : undefined}
                    className={`flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${
                        dashboardIsActive ? "bg-white/7 text-white" : "text-secondary hover:bg-white/7 hover:text-white"
                    }`}
                >
                    <IconLayoutDashboard aria-hidden="true" size={18} />
                    <span className="truncate">{content.sidebar.dashboard}</span>
                </Link>
            </nav>

            <div className="mt-6 min-h-0 flex-1 lg:overflow-y-auto">
                <Flex align="center" justify="space-between" className="mb-3 px-2">
                    <Text hierarchy="tertiary" className="text-xs! font-medium! tracking-wide!">
                        {content.licenses}
                    </Text>
                    {isLoading ? (
                        <span aria-hidden="true" className="h-5 w-6 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                    ) : (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#191825] px-1.5 py-[0.1167rem] text-[0.65rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                            {licenses.length}
                        </span>
                    )}
                </Flex>

                <nav aria-label={content.licenses}>
                    {isLoading ? (
                        <LicenseSidebarSkeleton />
                    ) : licenses.length > 0 ? (
                        <ul className="space-y-1.5">
                            {licenses.map((license) => {
                                const deployment = formatLicenseValue(license.deploymentType)
                                const status = formatLicenseValue(license.status)
                                const identifier = license.namespaceId?.trim() || getShortLicenseId(license.id)
                                const licenseHref = `/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`
                                const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                return (
                                    <li key={license.id}>
                                        <Link
                                            href={licenseHref}
                                            aria-current={licenseIsActive ? "page" : undefined}
                                            className={`group flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${
                                                licenseIsActive ? "bg-white/7 text-white" : "text-secondary hover:bg-white/7 hover:text-white"
                                            }`}
                                        >
                                            <span className="relative shrink-0">
                                                <LicensePlanIcon plan={license.plan} />
                                                <LicenseStatusDot
                                                    status={license.status}
                                                    aria-label={status}
                                                    title={status}
                                                    className="absolute -bottom-0.5 -right-0.5 ring-2 ring-light"
                                                />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex min-w-0 items-center gap-1.5">
                                                    <span className="truncate text-sm font-medium text-white">{license.name}</span>
                                                    {deployment ? <span className="shrink-0 text-xs text-tertiary">| {deployment}</span> : null}
                                                </span>
                                                <span className="block truncate text-xs text-tertiary">
                                                    {license.customerName} | {identifier}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-2 text-tertiary">
                            <IconKey aria-hidden="true" size={16} />
                            <span className="text-xs">{content.emptyLicenses}</span>
                        </div>
                    )}
                </nav>
            </div>

            <Button
                type="button"
                variant="none"
                paddingSize="sm"
                disabled={isLoggingOut}
                onClick={() => void logout()}
                className="mt-6 w-full! justify-start! gap-2! rounded-xl! text-secondary! hover:bg-white/7! hover:text-white! lg:mt-auto"
            >
                <IconArrowAutofitLeftFilled aria-hidden="true" size={17} />
                {isLoggingOut ? content.sidebar.loggingOut : content.sidebar.logout}
            </Button>
        </aside>
    )
}
