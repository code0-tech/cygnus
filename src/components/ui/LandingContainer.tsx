"use client"

import { cn } from "@/lib/utils"
import { Container } from "@code0-tech/pictor"
import { usePathname } from "next/navigation"
import React, { useLayoutEffect } from "react"

export function LandingContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    const pathname = usePathname()

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0 })
    }, [pathname])

    return <Container className={cn("min-h-dvh flex flex-col pt-4", className)}>{children}</Container>
}
