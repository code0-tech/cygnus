import { CheckoutSessionLayoutClient } from "@/components/checkout/CheckoutSessionLayoutClient"
import { getErrorsContent } from "@/lib/cms"
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

    const errors = await getErrorsContent(locale)
    return <CheckoutSessionLayoutClient errors={errors}>{children}</CheckoutSessionLayoutClient>
}
