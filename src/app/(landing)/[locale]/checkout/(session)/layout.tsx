import { CheckoutSessionLayoutClient } from "@/components/checkout/CheckoutSessionLayoutClient"
import { getCheckoutContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface CheckoutSessionLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export default async function CheckoutSessionLayout({ children, params }: CheckoutSessionLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const checkoutContent = await getCheckoutContent(locale)
    return (
        <CheckoutSessionLayoutClient formContent={checkoutContent?.form} stepperContent={checkoutContent?.stepper}>
            {children}
        </CheckoutSessionLayoutClient>
    )
}
