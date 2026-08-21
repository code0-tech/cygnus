"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/CraterSessionProvider"
import { Container } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { ErrorsContent } from "@/lib/cms"

interface CheckoutSessionLayoutClientProps {
    children: ReactNode
    errors?: ErrorsContent | null
}

export function CheckoutSessionLayoutClient({ children, errors }: CheckoutSessionLayoutClientProps) {
    return (
        <>
            <div className="border-b border-white/10 bg-primary/50 py-3 backdrop-blur-sm">
                <Container className="flex items-center">
                    <Link href="/" className="inline-flex shrink-0">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="h-8 w-32" loading="eager" />
                    </Link>
                </Container>
            </div>
            <CraterSessionProvider errorMessage={errors?.sessionUnavailable ?? errors?.paymentFallback}>
                <LandingContainer className="min-h-0 flex-1 overflow-y-auto my-8">{children}</LandingContainer>
            </CraterSessionProvider>
        </>
    )
}
