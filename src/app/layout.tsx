import type {Metadata} from "next"
import {Ubuntu} from "next/font/google"
import './globals.css'
import {FooterSection} from "@/static-components/FooterSection"
import {ReactNode} from "react"

const ubuntu = Ubuntu({style: "normal", weight: "500", subsets: ["latin"]})

export const metadata: Metadata = {
    title: "Code0 - Revolutionize the backend development",
    description: "Revolutionize the backend development"
}

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${ubuntu.className} max-w-screen`}>
                {children}
                <FooterSection/>
            </body>
        </html>
    )
}
