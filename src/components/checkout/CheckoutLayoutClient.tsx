"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/CraterSessionProvider"
import { CheckoutStageProvider, CheckoutStepper, type CheckoutStepperContent } from "@/components/checkout/CheckoutStepper"
import { Container } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export function CheckoutLayoutClient({ children, stepperContent }: { children: ReactNode; stepperContent?: CheckoutStepperContent | null }) {
    return (
        <CheckoutStageProvider>
            <div className="flex h-screen flex-col overflow-hidden">
                <div className="border-b border-white/10 bg-primary/50 py-3 backdrop-blur-sm">
                    <Container className="flex items-center justify-between">
                        <Link href="/" className="inline-flex shrink-0">
                            <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="h-8 w-32" loading="eager" />
                        </Link>
                        <div className="hidden lg:block">
                            <CheckoutStepper content={stepperContent} />
                        </div>
                    </Container>
                </div>
                <CraterSessionProvider>
                    <LandingContainer className="min-h-0 flex-1 overflow-y-auto my-8">{children}</LandingContainer>
                </CraterSessionProvider>
            </div>
        </CheckoutStageProvider>
    )
}
