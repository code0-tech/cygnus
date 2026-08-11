"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/CraterSessionProvider"
import { CheckoutStageProvider, CheckoutStepper, type CheckoutStepperContent } from "@/components/checkout/CheckoutStepper"
import { Container } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import type { CheckoutData } from "@/lib/cms"

export function CheckoutLayoutClient({ children, formContent, stepperContent }: { children: ReactNode; formContent?: CheckoutData["form"] | null; stepperContent?: CheckoutStepperContent | null }) {
    const pathname = usePathname()
    const isLoginPage = pathname?.endsWith("/checkout/login") ?? false
    const pageContent = <LandingContainer className="min-h-0 flex-1 overflow-y-auto my-8">{children}</LandingContainer>

    return (
        <CheckoutStageProvider>
            <div className="flex h-screen flex-col overflow-hidden">
                {!isLoginPage && (
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
                )}
                {isLoginPage ? pageContent : <CraterSessionProvider errorMessage={formContent?.errors.sessionUnavailable ?? formContent?.paymentErrorFallback}>{pageContent}</CraterSessionProvider>}
            </div>
        </CheckoutStageProvider>
    )
}
