"use client"

import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import type { LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { getNamespaceDisplayId } from "@/lib/licenses/licenseRoute"
import {
    Button,
    Flex,
    Menu,
    MenuContent,
    MenuItem,
    MenuLabel,
    MenuPortal,
    MenuSeparator,
    MenuTrigger,
    ScrollArea,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
    Text,
} from "@code0-tech/pictor"
import { IconArrowAutofitLeftFilled, IconKey, IconLayoutDashboard, IconMenu2, IconRefresh } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses" | "redirectUrl" | "sidebar" | "values">
    isLoading: boolean
    isRefreshing: boolean
    locale: AppLocale
    licenses: LicenseDashboardLicense[]
    onRefresh: () => void
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
                    <span className="size-4.5 shrink-0 rounded bg-white/10" />
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

export function LicenseSidebar({ content, isLoading, isRefreshing, locale, licenses, onRefresh }: LicenseSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const dashboardHref = `/${locale}/licenses`
    const dashboardIsActive = pathname === dashboardHref || pathname === `${dashboardHref}/`

    const logout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            const response = await fetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
            if (!response.ok) {
                setIsLoggingOut(false)
                return
            }

            window.location.replace(content.redirectUrl)
        } catch {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="min-h-0 lg:h-full">
            <header className="flex items-center justify-between bg-light pb-4 lg:hidden!">
                <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                    <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
                </Link>

                <Menu>
                    <MenuTrigger asChild>
                        <Button type="button" variant="normal" paddingSize="xs" aria-label={`${content.sidebar.dashboard} / ${content.licenses}`} className="size-9! justify-center! p-0!">
                            <IconMenu2 aria-hidden="true" size={18} />
                        </Button>
                    </MenuTrigger>
                    <MenuPortal>
                        <MenuContent
                            align="end"
                            sideOffset={8}
                            className="z-100 max-h-[calc(100dvh-5rem)]! w-[calc(100vw-2rem)]! overflow-y-auto! [&>.scroll-area--auto]:w-full! [&>.scroll-area--auto]:min-w-0! [&>.scroll-area--auto]:self-stretch! [&_.scroll-area__viewport]:w-full! [&_.scroll-area__viewport>div]:w-full!"
                        >
                            <MenuItem onSelect={() => router.push(dashboardHref)} className={dashboardIsActive ? "w-full! justify-start! bg-white/7! text-left!" : "w-full! justify-start! text-left!"}>
                                <IconLayoutDashboard aria-hidden="true" size={17} />
                                <span>{content.sidebar.dashboard}</span>
                            </MenuItem>

                            <MenuSeparator />
                            <MenuLabel className="flex w-full! items-center justify-between gap-3">
                                <span>{content.licenses}</span>
                                <span className="text-xs tabular-nums text-tertiary">{isLoading ? "…" : licenses.length}</span>
                            </MenuLabel>

                            {isLoading ? (
                                <div aria-hidden="true" className="space-y-1 px-2 py-1">
                                    {Array.from({ length: 3 }, (_, index) => (
                                        <div key={index} className="flex h-10 animate-pulse items-center gap-3 motion-reduce:animate-none">
                                            <span className="size-4 rounded bg-white/10" />
                                            <span className={index === 1 ? "h-3 w-24 rounded-full bg-white/10" : "h-3 w-32 rounded-full bg-white/10"} />
                                        </div>
                                    ))}
                                </div>
                            ) : licenses.length > 0 ? (
                                licenses.map((license) => {
                                    const deployment = formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values)
                                    const status = formatLicenseDisplayValue(license.status, "status", content.values)
                                    const identifier = getNamespaceDisplayId(license.namespaceId) || getShortLicenseId(license.id)
                                    const licenseHref = `/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`
                                    const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                    return (
                                        <MenuItem
                                            key={license.id}
                                            onSelect={() => router.push(licenseHref)}
                                            className={licenseIsActive ? "w-full! justify-start! bg-white/7! text-left!" : "w-full! justify-start! text-left!"}
                                        >
                                            <span className="relative shrink-0">
                                                <LicensePlanIcon plan={license.plan} size={16} />
                                                <LicenseStatusDot status={license.status} aria-label={status} title={status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-light" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm text-white">
                                                    {formatLicenseDisplayValue(license.plan, "plan", content.values)} | {deployment}
                                                </span>
                                                <span className="block truncate text-xs text-tertiary">
                                                    {license.customerName} | {identifier}
                                                </span>
                                            </span>
                                        </MenuItem>
                                    )
                                })
                            ) : (
                                <div className="flex items-center gap-2 px-2 py-3 text-tertiary">
                                    <IconKey aria-hidden="true" size={16} />
                                    <span className="text-xs">{content.emptyLicenses}</span>
                                </div>
                            )}

                            <MenuSeparator />
                            <MenuItem disabled={isLoading || isRefreshing} onSelect={onRefresh} className="w-full! justify-start! text-left!">
                                {isRefreshing ? (
                                    <ButtonLoader label={content.sidebar.refreshing} />
                                ) : (
                                    <>
                                        <IconRefresh aria-hidden="true" size={16} />
                                        <span>{content.sidebar.refresh}</span>
                                    </>
                                )}
                            </MenuItem>
                            <MenuItem disabled={isLoggingOut} onSelect={() => void logout()} className="w-full! justify-start! text-left!">
                                {isLoggingOut ? (
                                    <ButtonLoader label={content.sidebar.loggingOut} />
                                ) : (
                                    <>
                                        <IconArrowAutofitLeftFilled aria-hidden="true" size={16} />
                                        <span>{content.sidebar.logout}</span>
                                    </>
                                )}
                            </MenuItem>
                        </MenuContent>
                    </MenuPortal>
                </Menu>
            </header>

            <aside className="hidden min-h-0 flex-col bg-light pr-4 backdrop-blur-xl lg:flex lg:h-full">
                <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60 p-2">
                    <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
                </Link>

                <nav aria-label={content.sidebar.dashboard} className="mt-8">
                    <Link href={dashboardHref} aria-current={dashboardIsActive ? "page" : undefined}>
                        <Button
                            variant="normal"
                            paddingSize={"xxs"}
                            className={cn("w-full! justify-start! shadow-none! hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!", dashboardIsActive && "shadow-[inset_0_1px_1px_#bfbfbf1a]! bg-white/5!")}
                        >
                            <IconLayoutDashboard aria-hidden="true" size={18} />
                            <span className="truncate">{content.sidebar.dashboard}</span>
                        </Button>
                    </Link>
                </nav>

                <div className="mt-6 flex min-h-0 flex-1 flex-col">
                    <Flex align="center" justify="space-between" className="mb-3 px-2">
                        <Text hierarchy="tertiary" className="text-xs! font-medium! tracking-[0.5px]">
                            {content.licenses}
                        </Text>
                        <Flex align="center" style={{ gap: "0.25rem" }}>
                            <Button
                                type="button"
                                variant="none"
                                paddingSize="xs"
                                disabled={isLoading || isRefreshing}
                                onClick={onRefresh}
                                aria-label={isRefreshing ? content.sidebar.refreshing : content.sidebar.refresh}
                                title={isRefreshing ? content.sidebar.refreshing : content.sidebar.refresh}
                                className="size-7! p-0! text-tertiary! hover:text-white!"
                            >
                                {isRefreshing ? <ButtonLoader /> : <IconRefresh aria-hidden="true" size={14} />}
                            </Button>
                            {isLoading ? (
                                <span aria-hidden="true" className="h-5 w-6 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                            ) : (
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#191825] px-1.5 py-[0.1167rem] text-[0.65rem] font-normal tracking-[-0.5px] text-secondary shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                                    {licenses.length}
                                </span>
                            )}
                        </Flex>
                    </Flex>

                    <ScrollArea type="auto" className="min-h-0 flex-1">
                        <ScrollAreaViewport className="h-full pr-2">
                            <nav aria-label={content.licenses}>
                                {isLoading ? (
                                    <LicenseSidebarSkeleton />
                                ) : licenses.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {licenses.map((license) => {
                                            const deployment = formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values)
                                            const status = formatLicenseDisplayValue(license.status, "status", content.values)
                                            const identifier = getNamespaceDisplayId(license.namespaceId) || getShortLicenseId(license.id)
                                            const licenseHref = `/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`
                                            const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                            return (
                                                <li key={license.id}>
                                                    <Link href={licenseHref} aria-current={licenseIsActive ? "page" : undefined}>
                                                        <Button
                                                            variant="normal"
                                                            paddingSize="xxs"
                                                            className={cn(
                                                                "w-full! justify-start! shadow-none! hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!",
                                                                licenseIsActive && "shadow-[inset_0_1px_1px_#bfbfbf1a]! bg-white/5!"
                                                            )}
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
                                                            {formatLicenseDisplayValue(license.plan, "plan", content.values)}
                                                            {deployment ? <span className="shrink-0 text-xs text-tertiary">{`(${deployment})`}</span> : null}
                                                        </Button>
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
                        </ScrollAreaViewport>
                        <ScrollAreaScrollbar orientation="vertical">
                            <ScrollAreaThumb />
                        </ScrollAreaScrollbar>
                    </ScrollArea>
                </div>

                <Button
                    type="button"
                    variant="normal"
                    paddingSize="xxs"
                    disabled={isLoggingOut}
                    onClick={() => void logout()}
                    className="mt-6 w-full! justify-start! shadow-none! hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!"
                >
                    {isLoggingOut ? (
                        <ButtonLoader label={content.sidebar.loggingOut} />
                    ) : (
                        <>
                            <IconArrowAutofitLeftFilled aria-hidden="true" size={17} />
                            {content.sidebar.logout}
                        </>
                    )}
                </Button>
            </aside>
        </div>
    )
}
