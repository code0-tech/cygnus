import { Navigation } from "@/components/navigation/Navigation"
import { routing } from "@/i18n/routing"
import { FooterSection } from "@/sections/FooterSection"
import { siteConfig } from "@/utils/siteConfig"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { ReactNode } from "react"
import { hasLocale } from "use-intl"
import '../globals.css'

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = siteConfig

type Props = {
    children: ReactNode
    params: Promise<{locale: string}>
}

export default async function RootLayout({children, params}: Props) {
    const {locale} = await params
    if (!hasLocale(routing.locales, locale)) notFound()
    setRequestLocale(locale);

    return (
        <html lang="en">
            <body className={`${inter.className} tracking-[-0.5px] leading-[1.5] bg-primary`}>
                <NextIntlClientProvider>
                    <Navigation/>
                    <div className={"bg-primary"}>
                        {children}
                    </div>
                    <FooterSection/>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
