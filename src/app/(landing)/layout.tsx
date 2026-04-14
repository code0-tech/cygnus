import {MotionProvider} from "@/components/providers/MotionProvider"
import {createMetadata} from "@/lib/siteConfig"
import type {Metadata} from "next"
import {Inter} from "next/font/google"
import {ReactNode} from "react"
import './globals.css'

const inter = Inter({style: "normal", weight: "400", subsets: ["latin"]})

export const metadata: Metadata = createMetadata()

export default async function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
        <head>
            <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png"/>
            <link rel="manifest" href="/favicons/site.webmanifest"/>
            {/* Preload critical hero image */}
            <link
                rel="preload"
                as="image"
                href="/code0_software.png"
                imageSrcSet="/_next/image?url=%2Fcode0_software.png&w=384&q=75 384w, /_next/image?url=%2Fcode0_software.png&w=640&q=75 640w, /_next/image?url=%2Fcode0_software.png&w=750&q=75 750w, /_next/image?url=%2Fcode0_software.png&w=828&q=75 828w, /_next/image?url=%2Fcode0_software.png&w=1080&q=75 1080w, /_next/image?url=%2Fcode0_software.png&w=1200&q=75 1200w, /_next/image?url=%2Fcode0_software.png&w=1920&q=75 1920w, /_next/image?url=%2Fcode0_software.png&w=2048&q=75 2048w, /_next/image?url=%2Fcode0_software.png&w=3840&q=75 3840w"
                imageSizes="(min-width: 1024px) 60vw, 100vw"
            />
        </head>
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
