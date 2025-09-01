import type {Metadata} from "next"
import {Inter} from "next/font/google"
import './globals.css'
import {FooterSection} from "@/sections/FooterSection"
import {ReactNode} from "react"

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = {
    title: "Code0 - Revolutionize the backend development",
    description: "Revolutionize the backend development"
}

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-primary`}>
                {children}
                <FooterSection/>
            </body>
        </html>
    )
}
