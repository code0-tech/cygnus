import type {Metadata} from "next"
import {Inter} from "next/font/google"
import './globals.css'
import {FooterSection} from "@/sections/FooterSection"
import {ReactNode} from "react"
import {siteConfig} from "@/utils/siteConfig"

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = siteConfig

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-primary tracking-[-0.5px] leading-[1.5]`}>
                {children}
                <FooterSection/>
            </body>
        </html>
    )
}
