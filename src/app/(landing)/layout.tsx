import { Navigation } from "@/components/navigation/Navigation"
import { FooterSection } from "@/components/sections/FooterSection"
import { siteConfig } from "@/utils/siteConfig"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import './globals.css'

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = siteConfig

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} tracking-[-0.5px] leading-[1.5] bg-primary`}>
                <Navigation/>
                <div className={"bg-primary"}>
                    {children}
                </div>
                <FooterSection/>
            </body>
        </html>
    )
}
