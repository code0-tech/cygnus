"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/CraterSessionProvider"
import { CheckoutStageProvider, CheckoutStepper, type CheckoutStepperContent } from "@/components/checkout/CheckoutStepper"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export function CheckoutLayoutClient({ children, stepperContent }: { children: ReactNode; stepperContent?: CheckoutStepperContent | null }) {
    return (
        <CheckoutStageProvider>
            <div className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-primary/50 backdrop-blur-sm">
                <div className="relative mx-auto flex items-center px-6 py-3 mt-1">
                    <Link href="/" className="inline-flex shrink-0">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="h-8 w-32" loading="eager" />
                    </Link>
                    <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                        <CheckoutStepper content={stepperContent} />
                    </div>
                </div>
            </div>
            <CraterSessionProvider>
                <LandingContainer className="py-[12vh]">{children}</LandingContainer>
            </CraterSessionProvider>
        </CheckoutStageProvider>
    )
}
