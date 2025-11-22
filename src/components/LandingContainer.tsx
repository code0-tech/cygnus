"use client"

import {Container} from "@code0-tech/pictor"
import React from "react"
import {cn} from "@/utils/cn"

export function LandingContainer({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <Container className={cn("flex flex-col bg-primary py-[5%] border-x border-white/10", className)}>
            {children}
        </Container>
    )
}
