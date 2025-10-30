import type {Metadata} from "next"
import {Inter} from "next/font/google"
import '../globals.css'
import {FooterSection} from "@/sections/FooterSection"
import React, {ReactNode} from "react"
import {siteConfig} from "@/utils/siteConfig"
import {NextIntlClientProvider} from "next-intl"
import {hasLocale} from "use-intl"
import {routing} from "@/i18n/routing"
import {notFound} from "next/navigation"
import {setRequestLocale} from "next-intl/server"
import {Navigation} from "@/components/Navigation"

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
            <body className={`${inter.className} bg-primary tracking-[-0.5px] leading-[1.5]`}>
                <NextIntlClientProvider>
                    <Navigation/>
                    {children}
                    <FooterSection/>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
