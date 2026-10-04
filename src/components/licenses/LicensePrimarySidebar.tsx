"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import { Avatar, Button, Menu, MenuContent, MenuItem, MenuLabel, MenuPortal, MenuSeparator, MenuTrigger, Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "@code0-tech/pictor"
import { IconAdjustmentsFilled, IconApps, IconArrowAutofitLeftFilled, IconSettingsFilled, IconUser } from "@tabler/icons-react"
import Image from "next/image"
import type { ReactNode } from "react"

interface LicensePrimarySidebarProps {
    content: LicenseContent["sidebar"]
    isLoggingOut: boolean
    onLogout: () => void
    onOpenMainApplication: (path: string) => void
}

function NavigationTooltip({ children, label }: { children: ReactNode; label: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipPortal>
                <TooltipContent color="primary" side="right" sideOffset={8} className="text-xs!">
                    {label}
                </TooltipContent>
            </TooltipPortal>
        </Tooltip>
    )
}

export function LicensePrimarySidebar({ content, isLoggingOut, onLogout, onOpenMainApplication }: LicensePrimarySidebarProps) {
    const labels = {
        applicationSettings: content.applicationSettingsLabel,
        home: content.homeLabel,
        profile: content.profileLabel,
        settings: content.settingsLabel,
        userMenu: content.userMenuLabel,
        userSettings: content.userSettingsLabel,
        workspaces: content.workspacesLabel,
    }

    return (
        <aside className="hidden h-full min-h-0 flex-col items-center bg-transparent pr-5.5 lg:flex" aria-label="Code0">
            <NavigationTooltip label={labels.home}>
                <Button type="button" variant="none" onClick={() => onOpenMainApplication("/")} aria-label={labels.home} className="size-8.5! justify-center! p-0! hover:bg-white/10! rounded-2xl!">
                    <Image src="/favicons/android-chrome-192x192.png" alt="Code0" width={24} height={24} className="size-4 object-contain" priority />
                </Button>
            </NavigationTooltip>

            <div className="mt-3">
                <NavigationTooltip label={labels.applicationSettings}>
                    <Button
                        type="button"
                        variant="none"
                        onClick={() => onOpenMainApplication("/settings")}
                        aria-label={labels.applicationSettings}
                        className="size-8.5! justify-center! p-0! text-white! hover:bg-white/10! rounded-2xl!"
                    >
                        <IconAdjustmentsFilled aria-hidden="true" size={16} />
                    </Button>
                </NavigationTooltip>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <NavigationTooltip label={labels.userSettings}>
                    <Button
                        type="button"
                        variant="none"
                        onClick={() => onOpenMainApplication("/users/@me/settings")}
                        aria-label={labels.userSettings}
                        className="size-8.5! justify-center! p-0! text-white! hover:bg-white/10! rounded-2xl!"
                    >
                        <IconSettingsFilled aria-hidden="true" size={16} />
                    </Button>
                </NavigationTooltip>

                <Menu>
                    <MenuTrigger asChild>
                        <Button type="button" variant="none" aria-label={labels.userMenu} className="size-8.5! justify-center! p-0! hover:bg-white/10! rounded-2xl!">
                            <Avatar type="character" identifier="User" size={16} />
                        </Button>
                    </MenuTrigger>
                    <MenuPortal>
                        <MenuContent align="start" side="right" sideOffset={8} className="w-44! p-0!">
                            <MenuLabel className="px-1.5! pb-0.5! text-[9px]! font-medium! uppercase">{labels.userMenu}</MenuLabel>
                            <MenuItem onSelect={() => onOpenMainApplication("/users/@me")} className="whitespace-nowrap text-xs!">
                                <IconUser aria-hidden="true" size={16} />
                                {labels.profile}
                            </MenuItem>
                            <MenuItem onSelect={() => onOpenMainApplication("/users/@me/settings")} className="pl-8! whitespace-nowrap text-xs!">
                                {labels.settings}
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem onSelect={() => onOpenMainApplication("/")} className="whitespace-nowrap text-xs!">
                                <IconApps aria-hidden="true" size={16} />
                                {labels.workspaces}
                            </MenuItem>
                            <MenuItem onSelect={() => onOpenMainApplication("/")} className="pl-8! whitespace-nowrap text-xs!">
                                Personal Workspace
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
                                disabled={isLoggingOut}
                                className="whitespace-nowrap text-xs!"
                                onSelect={(event) => {
                                    // Keep the menu open so the loader stays visible until the redirect.
                                    event.preventDefault()
                                    onLogout()
                                }}
                            >
                                {isLoggingOut ? (
                                    <ButtonLoader label={content.loggingOut} />
                                ) : (
                                    <>
                                        <IconArrowAutofitLeftFilled aria-hidden="true" size={16} />
                                        {content.logout}
                                    </>
                                )}
                            </MenuItem>
                        </MenuContent>
                    </MenuPortal>
                </Menu>
            </div>
        </aside>
    )
}
