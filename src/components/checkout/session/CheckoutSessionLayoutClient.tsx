"use client"

import { LandingContainer } from "@/components/ui/LandingContainer"
import { CraterSessionProvider } from "@/components/checkout/session/CraterSessionProvider"
import { Container } from "@code0-tech/pictor"
import { IconLock } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import type { ErrorsContent } from "@/lib/cms"

interface CheckoutSessionLayoutClientProps {
    children: ReactNode
    errors?: ErrorsContent | null
    secureCheckoutLabel?: string | null
}

export function CheckoutSessionLayoutClient({ children, errors, secureCheckoutLabel }: CheckoutSessionLayoutClientProps) {
    const guestCheckout = useSearchParams().get("guestCheckout")
    return (
        <>
            <div className="shrink-0 border-b border-white/10 bg-primary/50 py-3 backdrop-blur-sm">
                <Container className="flex items-center justify-between gap-4">
                    <Link href="/" className="inline-flex shrink-0">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="h-7 w-28 sm:h-8 sm:w-32" loading="eager" />
                    </Link>
                    {secureCheckoutLabel && (
                        <span className="flex items-center gap-1.5 text-sm text-secondary">
                            <IconLock aria-hidden="true" size={16} />
                            <span className="max-sm:sr-only">{secureCheckoutLabel}</span>
                        </span>
                    )}
                </Container>
            </div>
            <CraterSessionProvider key={guestCheckout ?? "account"} errorMessage={errors?.sessionUnavailable ?? errors?.paymentFallback}>
                <LandingContainer className="min-h-0 flex-1 py-4">{children}</LandingContainer>
            </CraterSessionProvider>
        </>
    )
}
