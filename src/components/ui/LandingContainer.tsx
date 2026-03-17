"use client"

import {Container} from "@code0-tech/pictor"
import React from "react"
import {cn} from "@/lib/utils"

export function LandingContainer({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <Container className={cn("min-h-dvh flex flex-col pt-4", className)}>
            {children}
        </Container>
    )
}
