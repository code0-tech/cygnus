"use client"

import { Button, Flex, Text } from "@code0-tech/pictor"
import type { LicenseContent } from "@/lib/cms"
import { IconChevronRight, IconKey, IconLogout, IconStack2 } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AppLocale } from "@/lib/i18n"

export interface License {
    customerId?: string
    customerName?: string
    id: string
    name: string
    updatedAt?: string
}

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses" | "sidebar">
    locale: AppLocale
    licenses: License[]
}

export function LicenseSidebar({ content, locale, licenses }: LicenseSidebarProps) {
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const logout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            await fetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
        } finally {
            router.replace(`/${locale}`)
            router.refresh()
        }
    }

    return (
        <aside className="flex min-h-0 flex-col bg-light px-4 py-4 backdrop-blur-xl lg:h-full lg:px-5 lg:py-5">
            <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
            </Link>

            <div className="mt-8 min-h-0 flex-1 lg:overflow-y-auto">
                <Flex align="center" justify="space-between" className="mb-3 px-2">
                    <Text hierarchy="tertiary" className="text-xs! font-medium! uppercase tracking-[0.12em]!">
                        {content.licenses}
                    </Text>
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#191825] px-1.5 py-[0.1167rem] text-[0.65rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                        {licenses.length}
                    </span>
                </Flex>

                <nav aria-label={content.licenses}>
                    {licenses.length > 0 ? (
                        <ul className="space-y-1.5">
                            {licenses.map((license) => (
                                <li key={license.id}>
                                    <Link
                                        href={`/${locale}/licenses/customer/${encodeURIComponent(license.id)}`}
                                        className="group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-secondary outline-none transition-colors hover:bg-white/7 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
                                    >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                            <IconStack2 aria-hidden="true" size={16} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{license.name}</span>
                                            <span className="block text-xs text-tertiary">{content.licenses.toLowerCase()}</span>
                                        </span>
                                        <IconChevronRight aria-hidden="true" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" size={15} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-3 py-3 text-tertiary">
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
