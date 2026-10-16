"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import {
    Avatar,
    Button,
    getSize,
    Icon,
    Menu,
    MenuContent,
    MenuItem,
    MenuLabel,
    MenuPortal,
    MenuSeparator,
    MenuTrigger,
    Tooltip,
    TooltipContent,
    TooltipPortal,
    TooltipTrigger,
} from "@code0-tech/pictor"
import { IconAdjustmentsFilled, IconApps, IconArrowAutofitLeft, IconUser } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface LicensePrimarySidebarProps {
    content: LicenseContent["sidebar"]
    isLoggingOut: boolean
    onLogout: () => void
    onOpenMainApplication: (path: string, newWindow?: boolean) => void
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
        workspaces: content.workspacesLabel,
    }

    const buttonStyle = { padding: getSize("xs") }

    return (
        <aside className="hidden h-full min-h-0 flex-col items-center gap-[0.7rem] bg-transparent pr-5.5 lg:flex" aria-label="Code0">
            <NavigationTooltip label={labels.home}>
                <Button type="button" variant="none" style={buttonStyle} onClick={() => onOpenMainApplication("/", true)} aria-label={labels.home}>
                    <Icon icon="codezero:codezero" color="#fff" size={16} aria-hidden="true" />
                </Button>
            </NavigationTooltip>

            <Menu>
                <MenuTrigger asChild>
                    <Button type="button" variant="none" style={buttonStyle} aria-label={labels.userMenu}>
                        <Avatar type="character" identifier="User" size={16} />
                    </Button>
                </MenuTrigger>
                <MenuPortal>
                    <MenuContent align="end" alignOffset={-4} side="right" sideOffset={8}>
                        <MenuLabel>{labels.userMenu}</MenuLabel>
                        <MenuItem onSelect={() => onOpenMainApplication("/users/@me")}>
                            <IconUser aria-hidden="true" size={16} />
                            {labels.profile}
                        </MenuItem>
                        <MenuItem onSelect={() => onOpenMainApplication("/users/@me/settings")}>
                            <IconUser aria-hidden="true" color="transparent" size={16} />
                            {labels.settings}
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem onSelect={() => onOpenMainApplication("/")}>
                            <IconApps aria-hidden="true" size={16} />
                            {labels.workspaces}
                        </MenuItem>
                        <MenuItem onSelect={() => onOpenMainApplication("/")}>
                            <IconApps aria-hidden="true" color="transparent" size={16} />
                            Personal Workspace
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                            disabled={isLoggingOut}
                            onSelect={(event) => {
                                event.preventDefault()
                                onLogout()
                            }}
                        >
                            {isLoggingOut ? (
                                <ButtonLoader label={content.loggingOut} />
                            ) : (
                                <>
                                    <IconArrowAutofitLeft aria-hidden="true" size={16} />
                                    {content.logout}
                                </>
                            )}
                        </MenuItem>
                    </MenuContent>
                </MenuPortal>
            </Menu>

            <NavigationTooltip label={labels.applicationSettings}>
                <Button type="button" variant="none" style={buttonStyle} onClick={() => onOpenMainApplication("/settings", true)} aria-label={labels.applicationSettings}>
                    <IconAdjustmentsFilled aria-hidden="true" color="#fff" size={16} />
                </Button>
            </NavigationTooltip>
        </aside>
    )
}
