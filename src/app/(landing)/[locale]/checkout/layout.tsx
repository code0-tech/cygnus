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
    return <CheckoutLayoutClient formContent={checkoutContent?.form} stepperContent={checkoutContent?.stepper}>{children}</CheckoutLayoutClient>
}
