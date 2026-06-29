import { MotionProvider } from "@/components/providers/MotionProvider"
import { createMetadata } from "@/lib/siteConfig"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import "./globals.css"

const inter = Inter({ style: "normal", weight: "400", subsets: ["latin"] })

export const metadata: Metadata = createMetadata()

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
                <link rel="manifest" href="/favicons/site.webmanifest" />
            </head>
            <body className={`${inter.className} tracking-[-0.5px] leading-normal bg-primary`}>
                <MotionProvider>
                    <div className={"bg-primary"}>{children}</div>
                </MotionProvider>
            </body>
        </html>
    )
}
