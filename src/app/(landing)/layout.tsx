import { Navigation } from "@/components/navigation/Navigation"
import { FooterSection } from "@/components/sections/FooterSection"
import { baseUrl, createMetadata } from "@/utils/siteConfig"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import './globals.css'

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = createMetadata({
    title: {
        template: '%s | CodeZero',
        default: 'CodeZero',
    },
    description: "Revolutionize the backend development",
    metadataBase: baseUrl,
})

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} tracking-[-0.5px] leading-normal bg-primary`}>
                <Navigation/>
                <div className={"bg-primary"}>
                    {children}
                </div>
                <FooterSection/>
            </body>
        </html>
    )
}
