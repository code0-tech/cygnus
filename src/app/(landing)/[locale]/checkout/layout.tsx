import { getCheckoutContent } from "@/lib/cms"
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
    if (!isSupportedLocale(locale)) notFound()

    const checkoutContent = await getCheckoutContent(locale)
    return (
        <>
            <CheckoutLayoutClient stepperContent={checkoutContent?.stepper}>{children}</CheckoutLayoutClient>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center" aria-hidden="true">
                <div className="h-16 w-full bg-blue/20 blur-3xl" />
            </div>
        </>
    )
}
