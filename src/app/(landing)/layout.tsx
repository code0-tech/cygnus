import { createMetadata } from "@/lib/siteConfig"
import { MotionProvider } from "@/components/providers/MotionProvider"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import './globals.css'

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = createMetadata()

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} tracking-[-0.5px] leading-normal bg-primary`}>
                <MotionProvider>
                    <div className={"bg-primary"}>
                        {children}
                    </div>
                </MotionProvider>
            </body>
        </html>
    )
}
