"use client"

import { Inter } from "next/font/google"
import { StatusPage, type PageErrorProps } from "@/components/status/StatusPage"
import "./(landing)/globals.css"

const inter = Inter({ style: "normal", weight: "400", subsets: ["latin"] })

export default function GlobalError({ error, reset }: PageErrorProps) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <StatusPage code="500" reference={error.digest} reset={reset} />
            </body>
        </html>
    )
}
