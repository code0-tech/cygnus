import { CheckoutSessionLayoutClient } from "@/components/checkout/CheckoutSessionLayoutClient"
import { getCheckoutContent, getErrorsContent } from "@/lib/cms"
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

    const [checkoutContent, errors] = await Promise.all([getCheckoutContent(locale), getErrorsContent(locale)])
    return (
        <CheckoutSessionLayoutClient errors={errors} stepperContent={checkoutContent?.stepper}>
            {children}
        </CheckoutSessionLayoutClient>
    )
}
