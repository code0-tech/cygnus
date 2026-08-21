import { CheckoutStageProvider } from "@/components/checkout/CheckoutStage"
import { isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface CheckoutLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

// Only the shell lives here. Which chrome a route gets is decided by the route itself, never by reading the pathname in
// a client component: that value can already point at the next route while the current HTML is still hydrating.
export default async function CheckoutLayout({ children, params }: CheckoutLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    return (
        <CheckoutStageProvider>
            <div className="flex h-screen flex-col overflow-hidden">{children}</div>
        </CheckoutStageProvider>
    )
}
