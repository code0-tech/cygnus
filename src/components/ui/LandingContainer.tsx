"use client"

import { cn } from "@/lib/utils"
import { Container } from "@code0-tech/pictor"
import { usePathname } from "next/navigation"
import React, { useLayoutEffect } from "react"

// Shared across all LandingContainer instances so a navigation is handled exactly once,
// no matter whether the instance persists in a layout or mounts with the new page.
let lastHandledPathname: string | null = null
// Set by browser back/forward navigation so the following pathname change keeps the restored scroll position.
let isHistoryNavigation = false

if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
        isHistoryNavigation = true
    })
}

export function LandingContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    const pathname = usePathname()

    useLayoutEffect(() => {
        const isInitialLoad = lastHandledPathname === null
        if (lastHandledPathname === pathname) return
        lastHandledPathname = pathname

        const isHistory = isHistoryNavigation
        isHistoryNavigation = false

        // Initial load: keep the browser's position (reload restore, #hash in the URL).
        // Back/forward: keep the restored position.
        // Hash links (e.g. /pricing#faq): Next.js scrolls to the target.
        if (isInitialLoad || isHistory || window.location.hash) return

        window.scrollTo({ top: 0, left: 0 })
    }, [pathname])

    return <Container className={cn("min-h-dvh flex flex-col pt-4", className)}>{children}</Container>
}
