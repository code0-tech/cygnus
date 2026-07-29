"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/CraterSessionProvider"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export function CheckoutLayoutClient({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-primary/50 backdrop-blur-sm">
                <Link href="/">
                    <div className="mx-auto px-8 py-4">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="h-8 w-32" loading="eager" />
                    </div>
                </Link>
            </div>
            <CraterSessionProvider>
                <LandingContainer className="py-[12vh]">{children}</LandingContainer>
            </CraterSessionProvider>
        </>
    )
}
