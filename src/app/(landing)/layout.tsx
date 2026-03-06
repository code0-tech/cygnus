import { baseUrl, createMetadata } from "@/lib/siteConfig"
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
                <div className={"bg-primary"}>
                    {children}
                </div>
            </body>
        </html>
    )
}
