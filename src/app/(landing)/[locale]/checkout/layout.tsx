import { FooterSection } from "@/components/sections/FooterSection"
import { getFooter } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { CheckoutLayoutClient } from "@/components/checkout/CheckoutLayoutClient"

interface CheckoutLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export default async function CheckoutLayout({ children, params }: CheckoutLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    const footer = await getFooter(locale)
    const currentYear = new Date().getUTCFullYear()
    const stripePublishableKey = process.env.STRIPE_PUBLIC_KEY

    if (!stripePublishableKey) {
        throw new Error("STRIPE_PUBLIC_KEY is not configured.")
    }

    return (
        <>
            <CheckoutLayoutClient publishableKey={stripePublishableKey}>{children}</CheckoutLayoutClient>
            <FooterSection locale={locale} footer={footer} currentYear={currentYear} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center" aria-hidden="true">
                <div className="h-16 w-full bg-blue/20 blur-3xl" />
            </div>
        </>
    )
}
