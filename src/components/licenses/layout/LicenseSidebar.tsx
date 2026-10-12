"use client"

import { isLicenseStatusError, LicenseStatusDot } from "@/components/licenses/shared/LicenseStatusDot"
import { ButtonLoader } from "@/components/ui/Loader"
import { PICTOR_BADGE_CLASS_NAME, StableBadge } from "@/components/ui/StableBadge"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { type CustomerEditSection, getCustomerEditSectionLabels, getLicenseEditSectionLabels, LICENSE_EDIT_SECTIONS, type LicenseEditSection } from "@/lib/licenses/editSections"
import { downloadLicenseFile } from "@/lib/licenses/client"
import { createLicenseCustomerPath, createLicensePath, resolveCustomerRouteId } from "@/lib/licenses/routes"
import type { LicenseDashboardLicense } from "@/lib/licenses/types"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import {
    Avatar,
    Button,
    Flex,
    hashToColor,
    Menu,
    MenuContent,
    MenuItem,
    MenuLabel,
    MenuPortal,
    MenuSeparator,
    MenuTrigger,
    Spacing,
    Text,
} from "@code0-tech/pictor"
import {
    IconArrowAutofitLeftFilled,
    IconArrowLeft,
    IconChevronDown,
    IconCloud,
    IconCreditCard,
    IconDownload,
    IconKey,
    IconMenu2,
    IconServer,
    IconTrendingUp,
    IconUser,
} from "@tabler/icons-react"
import BorderBeam from "border-beam"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "dashboard" | "editor" | "emptyLicenses" | "invoices" | "license" | "licenses" | "sidebar" | "upgrade" | "values">
    isLoading: boolean
    isLoggingOut: boolean
    locale: AppLocale
    licenses: LicenseDashboardLicense[]
    onLogout: () => void
}

interface LicenseContextMenuItem {
    href: string
    icon: typeof IconUser
    label: string
}

function LicenseContextMenu({ icon: Icon, items, label, name, secondaryName }: { icon?: typeof IconUser; items: LicenseContextMenuItem[]; label: string; name: string; secondaryName?: string }) {
    return (
        <Menu>
            <MenuTrigger asChild>
                <Button type="button" paddingSize="xxs" w="100%" variant="none" justify="start" className="rounded-[50rem]! px-2!">
                    {Icon ? <Icon aria-hidden="true" size={16} className="shrink-0" /> : <Avatar bg="transparent" color={hashToColor(name, 200, 360)} identifier={name} size={16} />}
                    <span className="flex min-w-0 items-center gap-1 text-left">
                        <Text className="truncate">{name}</Text>
                        {secondaryName ? (
                            <Text hierarchy="tertiary" className="shrink-0">
                                {secondaryName}
                            </Text>
                        ) : null}
                    </span>
                    <IconChevronDown aria-hidden="true" className="ml-auto shrink-0" size={16} />
                </Button>
            </MenuTrigger>
            <MenuPortal>
                <MenuContent sideOffset={8} align="start" className="min-w-(--radix-popper-anchor-width)! items-stretch!">
                    <MenuLabel>{label}</MenuLabel>
                    {items.map((item) => {
                        const ItemIcon = item.icon

                        return (
                            <MenuItem key={item.href} asChild>
                                <Link href={item.href}>
                                    <ItemIcon aria-hidden="true" size={16} />
                                    {item.label}
                                </Link>
                            </MenuItem>
                        )
                    })}
                </MenuContent>
            </MenuPortal>
        </Menu>
    )
}

function LicenseUpgradeButton({ content, license, locale }: { content: LicenseSidebarProps["content"]; license?: LicenseDashboardLicense; locale: AppLocale }) {
    const href = license?.subscriptionId ? `${createLicensePath(locale, license.customerId, license.id)}/edit?tab=upgrade` : null
    const beam = (
        <BorderBeam strength={1} size="sm" theme="dark" duration={5} active={Boolean(href)} style={{ display: "block" }}>
            <Button type="button" paddingSize="xxs" color="tertiary" disabled={!href} justify="center" w="100%" className="rounded-2xl! text-xs!">
                {content.upgrade.title}
            </Button>
        </BorderBeam>
    )

    return href ? (
        <Link href={href} className="block">
            {beam}
        </Link>
    ) : (
        beam
    )
}

// Self-hosted licenses are delivered as a file, so the sidebar keeps the download next to the plan actions.
function LicenseDownloadButton({ content, license }: { content: LicenseSidebarProps["content"]; license: LicenseDashboardLicense }) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [hasFailed, setHasFailed] = useState(false)

    const download = async () => {
        if (!license.licenseId || isDownloading) return

        setIsDownloading(true)
        setHasFailed(false)

        try {
            await downloadLicenseFile(license.licenseId)
        } catch {
            setHasFailed(true)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div>
            <Button
                type="button"
                paddingSize="xxs"
                variant="none"
                justify="start"
                w="100%"
                disabled={isDownloading || !license.licenseId}
                onClick={() => void download()}
                className={cn("rounded-2xl! text-xs!", license.licenseId && "hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!")}
            >
                {isDownloading ? (
                    <ButtonLoader label={content.sidebar.downloadLicenseLabel} />
                ) : (
                    <>
                        <IconDownload aria-hidden="true" size={16} />
                        <span className="min-w-0 truncate">{content.sidebar.downloadLicenseLabel}</span>
                    </>
                )}
            </Button>
            {hasFailed ? (
                <Text role="alert" size="sm" hierarchy="tertiary" display="block" className="mt-1! px-2 text-xs! text-error!">
                    {content.invoices.unavailableLabel}
                </Text>
            ) : null}
        </div>
    )
}

function LicenseBackToCustomerButton({ label, license, locale }: { label: string; license?: LicenseDashboardLicense; locale: AppLocale }) {
    const button = (
        <Button
            type="button"
            paddingSize="xxs"
            variant="none"
            justify="start"
            w="100%"
            disabled={!license}
            className={cn("rounded-2xl! text-xs!", license && "hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!")}
        >
            <IconArrowLeft aria-hidden="true" size={16} />
            <span className="min-w-0 truncate">{label}</span>
        </Button>
    )

    return license ? (
        <Link href={createLicenseCustomerPath(locale, license.customerId)} className="block">
            {button}
        </Link>
    ) : (
        button
    )
}

function getLicenseSidebarName(license: LicenseDashboardLicense, values: LicenseContent["values"]) {
    const planName = formatLicenseDisplayValue(license.plan, "plan", values)
    if (license.deploymentType === "self_hosted") return planName
    return license.namespaceName || planName
}

function getShortLicenseId(id: string) {
    const identifier = id.split("/").at(-1)?.trim()
    return `#${identifier || id.slice(-6)}`
}

const SKELETON_NAME_WIDTHS = ["w-14", "w-20", "w-16"]

function LicenseSidebarSkeleton() {
    return (
        <ul aria-hidden="true">
            {SKELETON_NAME_WIDTHS.map((width) => (
                <li key={width} className="flex h-7 animate-pulse items-center gap-2 px-2.25 motion-reduce:animate-none">
                    <span className="size-3.25 shrink-0 rounded-[5px] bg-white/10" />
                    <span className={cn("block h-3 max-w-full rounded-full bg-white/10", width)} />
                </li>
            ))}
        </ul>
    )
}

// Mirrors a mobile menu entry: name and "customer | id" stacked next to a 16px icon.
function LicenseMenuSkeleton() {
    return (
        <div aria-hidden="true">
            {SKELETON_NAME_WIDTHS.map((width) => (
                <div key={width} className="flex animate-pulse items-center gap-2.25 px-2.25 py-1.75 motion-reduce:animate-none">
                    <span className="size-4 shrink-0 rounded-[5px] bg-white/10" />
                    <span className="min-w-0 flex-1">
                        <span className="flex h-5 items-center">
                            <span className={cn("block h-3 rounded-full bg-white/10", width)} />
                        </span>
                        <span className="flex h-4 items-center">
                            <span className="block h-2.5 w-28 max-w-full rounded-full bg-white/[0.07]" />
                        </span>
                    </span>
                </div>
            ))}
        </div>
    )
}

function getCustomerContextMenu(customerEditPath: string, customerName: string | undefined, content: LicenseSidebarProps["content"]) {
    const label = content.dashboard.customerLabel
    const sectionLabels = getCustomerEditSectionLabels(content.editor)
    const sectionIcons = { general: IconUser, paymentMethods: IconCreditCard } satisfies Record<CustomerEditSection, typeof IconUser>
    const sections: CustomerEditSection[] = ["general", "paymentMethods"]

    return {
        items: sections.map((section) => ({ href: `${customerEditPath}?tab=${section}`, icon: sectionIcons[section], label: sectionLabels[section] })),
        label,
        name: customerName || label,
    }
}

function getLicenseContextMenu(license: LicenseDashboardLicense, content: LicenseSidebarProps["content"], locale: AppLocale) {
    const editPath = `${createLicensePath(locale, license.customerId, license.id)}/edit`
    const sectionLabels = getLicenseEditSectionLabels(content)
    const sectionIcons = { general: IconKey, payment: IconCreditCard, upgrade: IconTrendingUp } satisfies Record<LicenseEditSection, typeof IconKey>
    const sections: readonly LicenseEditSection[] = license.subscriptionId ? LICENSE_EDIT_SECTIONS : ["general"]

    return {
        icon: license.deploymentType === "self_hosted" ? IconServer : IconCloud,
        items: sections.map((section) => ({ href: `${editPath}?tab=${section}`, icon: sectionIcons[section], label: sectionLabels[section] })),
        label: content.license,
        name: getLicenseSidebarName(license, content.values),
        secondaryName: getShortLicenseId(license.id),
    }
}

export function LicenseSidebar({ content, isLoading, isLoggingOut, locale, licenses, onLogout }: LicenseSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const activeLicense = licenses.find((license) => {
        const href = createLicensePath(locale, license.customerId, license.id)
        return pathname === href || pathname?.startsWith(`${href}/`)
    })
    const customerRouteSegment = pathname?.match(/\/licenses\/customer\/([^/]+)/)?.[1]
    // While a license page loads, its actions are already shown, disabled until the license is known.
    const showLicenseActions = Boolean(activeLicense) || (isLoading && /\/licenses\/customer\/[^/]+\/license\/[^/]+/.test(pathname ?? ""))
    const customerId = customerRouteSegment ? resolveCustomerRouteId(customerRouteSegment) : undefined
    const contextMenu = activeLicense
        ? getLicenseContextMenu(activeLicense, content, locale)
        : customerRouteSegment
          ? getCustomerContextMenu(`/${locale}/licenses/customer/${customerRouteSegment}/edit`, licenses.find((license) => license.customerId === customerId)?.customerName, content)
          : null
    return (
        <div className="min-h-0 lg:h-full">
            <header className="bg-transparent pb-4 lg:hidden!">
                <div className="flex items-center justify-between">
                    <Link href={`/${locale}`} className="inline-flex w-fit items-center rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                        <Image src="/code0_text_logo_white.png" alt="CodeZero" width={128} height={32} className="h-7 w-auto object-contain" priority />
                    </Link>

                    <Menu>
                        <MenuTrigger asChild>
                            <Button type="button" variant="normal" paddingSize="xs" aria-label={content.licenses} className="size-9! justify-center! p-0!">
                                <IconMenu2 aria-hidden="true" size={18} />
                            </Button>
                        </MenuTrigger>
                        <MenuPortal>
                            <MenuContent
                                align="end"
                                sideOffset={8}
                                className="z-100 max-h-[calc(100dvh-5rem)]! w-[calc(100vw-2rem)]! overflow-y-auto! [&>.scroll-area--auto]:w-full! [&>.scroll-area--auto]:min-w-0! [&>.scroll-area--auto]:self-stretch! [&_.scroll-area__viewport]:w-full! [&_.scroll-area__viewport>div]:w-full!"
                            >
                                <MenuLabel className="flex w-full! items-center justify-between gap-3">
                                    <span>{content.licenses}</span>
                                    {isLoading ? null : <span className="text-xs tabular-nums text-tertiary">{licenses.length}</span>}
                                </MenuLabel>

                                {isLoading ? (
                                    <LicenseMenuSkeleton />
                                ) : licenses.length > 0 ? (
                                    licenses.map((license) => {
                                        const status = formatLicenseDisplayValue(license.status, "status", content.values)
                                        const licenseHref = createLicensePath(locale, license.customerId, license.id)
                                        const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                        return (
                                            <MenuItem
                                                key={license.id}
                                                onSelect={() => router.push(licenseHref)}
                                                className={licenseIsActive ? "w-full! justify-start! bg-white/7! text-left!" : "w-full! justify-start! text-left!"}
                                            >
                                                <span className="relative shrink-0">
                                                    {license.deploymentType === "self_hosted" ? <IconServer aria-hidden="true" size={16} /> : <IconCloud aria-hidden="true" size={16} />}
                                                    {isLicenseStatusError(license.status) ? (
                                                        <LicenseStatusDot status={license.status} aria-label={status} title={status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-light" />
                                                    ) : null}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm text-white">{getLicenseSidebarName(license, content.values)}</span>
                                                    <span className="block truncate text-xs text-tertiary">
                                                        {license.customerName} | {getShortLicenseId(license.id)}
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
                                <MenuItem disabled={isLoggingOut} onSelect={onLogout} className="w-full! justify-start! text-left!">
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
                </div>
            </header>

            <aside className="hidden min-h-0 flex-col bg-transparent pr-4 lg:flex lg:h-full">
                <Flex h="100%" pt={0.5} style={{ boxSizing: "border-box", flexDirection: "column", minHeight: 0 }}>
                    <Flex align="center" justify="space-between">
                        <Text pl={0.7} hierarchy="tertiary">
                            {content.licenses}
                        </Text>
                        {isLoading ? null : (
                            <StableBadge color="secondary" className={PICTOR_BADGE_CLASS_NAME}>
                                {licenses.length}
                            </StableBadge>
                        )}
                    </Flex>
                    <Spacing spacing="xxs" />
                    {/* A plain overflow container, not a ScrollArea: Radix wraps its viewport in a display:table div that collapses the rows to their text width. */}
                    <nav aria-label={content.licenses} className="min-h-0 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <LicenseSidebarSkeleton />
                        ) : licenses.length > 0 ? (
                            <ul className="flex flex-col">
                                {licenses.map((license) => {
                                    const status = formatLicenseDisplayValue(license.status, "status", content.values)
                                    const licenseHref = createLicensePath(locale, license.customerId, license.id)
                                    const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                    return (
                                        <li key={license.id}>
                                            <Link href={licenseHref} aria-current={licenseIsActive ? "page" : undefined} className="block w-full" prefetch>
                                                <Button variant="none" w="100%" justify="flex-start" paddingSize="xxs" active={licenseIsActive}>
                                                    <span className="relative shrink-0">
                                                        {license.deploymentType === "self_hosted" ? <IconServer aria-hidden="true" size={13} /> : <IconCloud aria-hidden="true" size={13} />}
                                                        {isLicenseStatusError(license.status) ? (
                                                            <LicenseStatusDot status={license.status} aria-label={status} title={status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-light" />
                                                        ) : null}
                                                    </span>
                                                    <span className="flex min-w-0 items-center gap-1">
                                                        <Text className="truncate">{getLicenseSidebarName(license, content.values)}</Text>
                                                        <Text hierarchy="tertiary" className="shrink-0">
                                                            {getShortLicenseId(license.id)}
                                                        </Text>
                                                    </span>
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
                </Flex>
                <div className="mt-6 flex shrink-0 flex-col gap-3">
                    {showLicenseActions ? <LicenseUpgradeButton content={content} license={activeLicense} locale={locale} /> : null}
                    {activeLicense?.deploymentType === "self_hosted" ? <LicenseDownloadButton content={content} license={activeLicense} /> : null}
                    {showLicenseActions ? <LicenseBackToCustomerButton label={content.sidebar.backToCustomerLabel} license={activeLicense} locale={locale} /> : null}
                    {contextMenu ? <LicenseContextMenu {...contextMenu} /> : null}
                </div>
            </aside>
        </div>
    )
}
