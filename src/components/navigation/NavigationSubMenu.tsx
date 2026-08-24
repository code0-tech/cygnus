"use client"

import type { ShortLink, ShortLinkGroup, SubNavGroup, SubNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { IconArrowUpRight } from "@tabler/icons-react"
import Link from "next/link"
import React from "react"

type NavigationSubMenuProps = {
    embedded?: boolean
    groups?: SubNavGroup[]
    shortLinkGroups?: ShortLinkGroup[]
    onSelect?: (item: ShortLink | SubNavItem) => void
}

const GROUP_HEADING_CLASS = "px-2 text-xs font-semibold uppercase tracking-wide text-tertiary"

const NavigationSubMenu: React.FC<NavigationSubMenuProps> = ({ embedded = false, groups = [], shortLinkGroups = [], onSelect }) => {
    const visibleGroups = groups.filter((group) => group.items.length > 0)
    const visibleShortLinkGroups = shortLinkGroups.filter((group) => group.links.length > 0)
    const showGroupHeadings = visibleGroups.length > 1
    const hasNavigationItems = visibleGroups.length > 0
    const hasShortLinks = visibleShortLinkGroups.length > 0

    return (
        <div className={cn("flex w-full flex-col overflow-hidden rounded-xl", hasNavigationItems && hasShortLinks && "md:min-w-[52rem] md:flex-row md:gap-4")}>
            {hasNavigationItems && (
                <div className={cn("flex-1 space-y-5", embedded ? "py-2 md:pb-0 md:pt-4" : "p-2 md:p-4", hasShortLinks ? "md:min-w-[36rem]" : "md:min-w-[32rem]")}>
                    {visibleGroups.map((group) => (
                        <section key={group.key} aria-label={group.title} className="space-y-1.5">
                            {showGroupHeadings && <p className={GROUP_HEADING_CLASS}>{group.title}</p>}
                            <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                                {group.items.map((subItem) => (
                                    <Link
                                        key={subItem.key || subItem.title}
                                        href={subItem.href}
                                        onClick={() => onSelect?.(subItem)}
                                        className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl p-1 pl-2 transition-colors hover:bg-light"
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center text-secondary transition-colors group-hover:text-white group-hover:ring-white/10">
                                            {subItem.icon}
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <p className="truncate text-sm font-semibold text-white">{subItem.title}</p>
                                            <p className="truncate text-xs text-secondary">{subItem.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {hasShortLinks && (
                <aside className={"mt-4 space-y-5 p-4 md:w-64 md:shrink-0 md:border border-white/5 rounded-xl"}>
                    {visibleShortLinkGroups.map((group) => (
                        <section key={group.key} aria-label={group.title} className="space-y-1.5">
                            <p className={GROUP_HEADING_CLASS}>{group.title}</p>
                            <div className="flex flex-col">
                                {group.links.map((link) => (
                                    <Link
                                        key={link.key}
                                        href={link.href}
                                        target={link.newTab ? "_blank" : undefined}
                                        rel={link.newTab ? "noreferrer" : undefined}
                                        onClick={() => onSelect?.(link)}
                                        className="group flex items-center justify-between gap-3 rounded-lg p-1 pl-2 text-sm font-medium text-secondary transition-colors hover:bg-light hover:text-white"
                                    >
                                        <span>{link.title}</span>
                                        {link.newTab && <IconArrowUpRight aria-hidden="true" className="opacity-60" size={15} />}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </aside>
            )}
        </div>
    )
}

export { NavigationSubMenu }
