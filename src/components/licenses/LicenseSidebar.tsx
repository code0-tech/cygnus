"use client"

import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createLicenseCustomerPath, createLicensePath } from "@/lib/licenses/licenseRoute"
import type { LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { getNamespaceDisplayId } from "@/lib/licenses/licenseRoute"
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
    MenuSub,
    MenuSubContent,
    MenuSubTrigger,
    MenuTrigger,
    ScrollArea,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
    Text,
} from "@code0-tech/pictor"
import { IconArrowAutofitLeftFilled, IconArrowLeft,IconCheck, IconChevronDown, IconChevronRight, IconKey, IconMenu2, IconServer, IconSettings, IconShieldLock, IconSwitch, IconUsers } from "@tabler/icons-react"
import BorderBeam from "border-beam"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface LicenseSidebarProps {
    content: Pick<LicenseContent, "emptyLicenses" | "licenses" | "sidebar" | "upgrade" | "values">
    isLoading: boolean
    isLoggingOut: boolean
    locale: AppLocale
    licenses: LicenseDashboardLicense[]
    onLogout: () => void
    onOpenMainApplication: (path: string) => void
}

function LicenseWorkspaceMenu({
    content,
    currentLicense,
    licenses,
    locale,
    onOpenMainApplication,
}: {
    content: LicenseSidebarProps["content"]
    currentLicense?: LicenseDashboardLicense
    licenses: LicenseDashboardLicense[]
    locale: AppLocale
    onOpenMainApplication: LicenseSidebarProps["onOpenMainApplication"]
}) {
    const labels =
        locale === "de"
            ? { members: "Mitglieder", roles: "Rollen", servers: "Server", settings: "Einstellungen", switchWorkspace: "Workspace wechseln", workspace: "Workspace" }
            : { members: "Members", roles: "Roles", servers: "Servers", settings: "Settings", switchWorkspace: "Switch workspace", workspace: "Workspace" }
    const workspaceLicenses = licenses.filter((license) => getNamespaceDisplayId(license.namespaceId))
    const selectedWorkspace = (currentLicense?.namespaceId ? currentLicense : undefined) ?? workspaceLicenses[0]
    const namespaceId = getNamespaceDisplayId(selectedWorkspace?.namespaceId)
    const name = selectedWorkspace?.customerName || (selectedWorkspace ? formatLicenseDisplayValue(selectedWorkspace.plan, "plan", content.values) : content.licenses)
    const description = namespaceId || (selectedWorkspace ? formatLicenseDisplayValue(selectedWorkspace.deploymentType, "deploymentType", content.values) : "")
    const workspaceSettingsPath = namespaceId ? `/namespace/${namespaceId}/settings` : "/settings"

    return (
        <Menu>
            <MenuTrigger asChild>
                <Button type="button" paddingSize="xxs" w="100%" variant="none" justify="start" className="rounded-[50rem]! px-2!">
                    <Avatar bg="transparent" color={hashToColor(name, 200, 360)} identifier={name} size={16} />
                    <span className="min-w-0 text-left">
                        <Text className="block truncate">{name}</Text>
                        {description ? (
                            <Text hierarchy="tertiary" className="block truncate text-xs!">
                                {description}
                            </Text>
                        ) : null}
                    </span>
                    <IconChevronDown aria-hidden="true" className="ml-auto shrink-0" size={16} />
                </Button>
            </MenuTrigger>
            <MenuPortal>
                <MenuContent sideOffset={8} align="start" w="var(--radix-popper-anchor-width)">
                    <MenuLabel>{labels.workspace}</MenuLabel>
                    <MenuItem onSelect={() => onOpenMainApplication(workspaceSettingsPath)}>
                        <IconSettings aria-hidden="true" size={16} />
                        {labels.settings}
                    </MenuItem>
                    <MenuItem onSelect={() => onOpenMainApplication(namespaceId ? `${workspaceSettingsPath}?tab=members` : "/")}>
                        <IconUsers aria-hidden="true" size={16} />
                        {labels.members}
                    </MenuItem>
                    <MenuItem onSelect={() => onOpenMainApplication(namespaceId ? `${workspaceSettingsPath}?tab=roles` : "/")}>
                        <IconShieldLock aria-hidden="true" size={16} />
                        {labels.roles}
                    </MenuItem>
                    <MenuItem onSelect={() => onOpenMainApplication(namespaceId ? `${workspaceSettingsPath}?tab=servers` : "/")}>
                        <IconServer aria-hidden="true" size={16} />
                        {labels.servers}
                    </MenuItem>
                    <MenuSeparator />
                    {workspaceLicenses.length > 0 ? (
                        <MenuSub>
                            <MenuSubTrigger>
                                <IconSwitch aria-hidden="true" size={16} />
                                <Flex align="center" justify="space-between" w="100%">
                                    {labels.switchWorkspace}
                                    <IconChevronRight aria-hidden="true" size={16} />
                                </Flex>
                            </MenuSubTrigger>
                            <MenuSubContent sideOffset={8} alignOffset={-4}>
                                {workspaceLicenses.map((license) => {
                                    const entryNamespaceId = getNamespaceDisplayId(license.namespaceId)!
                                    const entryName = license.customerName || formatLicenseDisplayValue(license.plan, "plan", content.values)

                                    return (
                                        <MenuItem key={license.id} onSelect={() => onOpenMainApplication(`/namespace/${entryNamespaceId}`)}>
                                            <Avatar bg="transparent" color={hashToColor(entryName, 200, 360)} identifier={entryName} size={16} />
                                            <Flex align="center" justify="space-between" w="100%" style={{ gap: "0.7rem" }}>
                                                <span className="truncate">{entryName}</span>
                                                <IconCheck aria-hidden="true" size={16} color={license.id === currentLicense?.id ? undefined : "transparent"} />
                                            </Flex>
                                        </MenuItem>
                                    )
                                })}
                            </MenuSubContent>
                        </MenuSub>
                    ) : (
                        <MenuItem onSelect={() => onOpenMainApplication("/")}>
                            <IconSwitch aria-hidden="true" size={16} />
                            {labels.switchWorkspace}
                        </MenuItem>
                    )}
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

function LicenseBackToCustomerButton({ license, locale }: { license: LicenseDashboardLicense; locale: AppLocale }) {
    const label = locale === "de" ? "Zurück zum Kunden" : "Back to customer"

    return (
        <Link href={createLicenseCustomerPath(locale, license.customerId)} className="block">
            <Button type="button" paddingSize="xxs" variant="none" justify="start" w="100%" className="rounded-2xl! text-xs! hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!">
                <IconArrowLeft aria-hidden="true" size={16} />
                <span className="min-w-0 truncate">{label}</span>
            </Button>
        </Link>
    )
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

export function LicenseSidebar({ content, isLoading, isLoggingOut, locale, licenses, onLogout, onOpenMainApplication }: LicenseSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const activeLicense = licenses.find((license) => {
        const href = createLicensePath(locale, license.customerId, license.id)
        return pathname === href || pathname?.startsWith(`${href}/`)
    })
    const currentLicense = activeLicense ?? licenses[0]
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
                                        const licenseHref = createLicensePath(locale, license.customerId, license.id)
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
                <div className="flex min-h-0 flex-1 flex-col pt-2">
                    <Text hierarchy="tertiary" className="text-xs! font-medium! tracking-[0.5px] ml-2 mb-3">
                        {content.licenses}
                    </Text>

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
                                            const licenseHref = createLicensePath(locale, license.customerId, license.id)
                                            const licenseIsActive = pathname === licenseHref || pathname?.startsWith(`${licenseHref}/`)

                                            return (
                                                <li key={license.id}>
                                                    <Link href={licenseHref} aria-current={licenseIsActive ? "page" : undefined}>
                                                        <Button
                                                            variant="none"
                                                            paddingSize="xxs"
                                                            className={cn(
                                                                "w-full! justify-start! shadow-none! rounded-2xl! hover:shadow-[inset_0_1px_1px_#bfbfbf1a]!",
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
                                                            <Text size="md">{formatLicenseDisplayValue(license.plan, "plan", content.values)}</Text>
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
                <div className="mt-6 flex shrink-0 flex-col gap-2">
                    {activeLicense ? <LicenseBackToCustomerButton license={activeLicense} locale={locale} /> : null}
                    <LicenseUpgradeButton content={content} license={currentLicense} locale={locale} />
                    <LicenseWorkspaceMenu content={content} currentLicense={currentLicense} licenses={licenses} locale={locale} onOpenMainApplication={onOpenMainApplication} />
                </div>
            </aside>
        </div>
    )
}
