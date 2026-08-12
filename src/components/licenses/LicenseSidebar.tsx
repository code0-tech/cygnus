"use client"

import { Button, Flex, Text } from "@code0-tech/pictor"
import type { LicenseContent } from "@/lib/cms"
import { IconChevronRight, IconKey, IconLogout, IconStack2 } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { AppLocale } from "@/lib/i18n"
import type { LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses" | "redirectUrl" | "sidebar">
    isLoading: boolean
    locale: AppLocale
    licenses: LicenseDashboardLicense[]
}

function LicenseSidebarSkeleton() {
    return (
        <ul aria-hidden="true" className="space-y-1.5">
            {Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="flex animate-pulse items-center gap-3 rounded-xl px-2 py-1.5 motion-reduce:animate-none">
                    <span className="size-4 shrink-0 rounded bg-white/10" />
                    <span className={index === 1 ? "h-3 w-24 rounded-full bg-white/10" : "h-3 w-32 rounded-full bg-white/10"} />
                </li>
            ))}
        </ul>
    )
}

export function LicenseSidebar({ content, isLoading, locale, licenses }: LicenseSidebarProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false)

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
        <aside className="flex min-h-0 flex-col bg-light px-4 py-4 backdrop-blur-xl lg:h-full lg:px-5 lg:py-5">
            <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
            </Link>

            <div className="mt-8 min-h-0 flex-1 lg:overflow-y-auto">
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
                            {licenses.map((license) => (
                                <li key={license.id}>
                                    <Link
                                        href={`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`}
                                        className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 text-secondary outline-none transition-colors hover:bg-white/7 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
                                    >
                                        <IconStack2 aria-hidden="true" size={16} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{license.name}</span>
                                        </span>
                                        <IconChevronRight aria-hidden="true" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" size={15} />
                                    </Link>
                                </li>
                            ))}
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
                <IconLogout aria-hidden="true" size={17} />
                {isLoggingOut ? content.sidebar.loggingOut : content.sidebar.logout}
            </Button>
        </aside>
    )
}
