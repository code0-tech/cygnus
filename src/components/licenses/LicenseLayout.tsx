"use client"

import { LicenseSidebar, type LicenseProject } from "@/components/licenses/LicenseSidebar"
import { FullScreen, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@code0-tech/pictor"
import type { ReactNode } from "react"

interface LicenseLayoutProps {
    children: ReactNode
    locale: "de" | "en"
    projects?: LicenseProject[]
}

export function LicenseLayout({ children, locale, projects = [] }: LicenseLayoutProps) {
    return (
        <FullScreen className="h-dvh! min-h-0! overflow-hidden! bg-light! p-4! text-white">
            <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <LicenseSidebar locale={locale} projects={projects} />

                <main className="h-full min-h-0 min-w-0 overflow-hidden rounded-2xl bg-primary">
                    <ScrollArea h="100%" type="scroll">
                        <ScrollAreaViewport>
                            <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1rem" }}>{children}</div>
                        </ScrollAreaViewport>
                        <ScrollAreaScrollbar orientation="vertical">
                            <ScrollAreaThumb />
                        </ScrollAreaScrollbar>
                    </ScrollArea>
                </main>
            </div>
        </FullScreen>
    )
}
