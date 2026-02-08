"use client"

import {Container} from "@code0-tech/pictor"
import React from "react"
import {cn} from "@/utils/cn"

export function LandingContainer({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <Container className={cn("min-h-dvh flex flex-col bg-primary pt-[5%] px-[10%]!", className)}>
            {children}
        </Container>
    )
}
