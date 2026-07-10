"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

export function ProductHuntBadge() {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <a
            href="https://www.producthunt.com/products/codezero?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-codezero-2"
            target="_blank"
            rel="noopener noreferrer"
            inert={!isVisible}
            className={cn(!isVisible && "pointer-events-none opacity-0")}
        >
            <img
                alt="CodeZero - An open source no-code automation builder | Product Hunt"
                width="200"
                height="54"
                className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 md:right-4 lg:left-auto lg:translate-0"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1125393&theme=dark&t=1776350762444"
                onLoad={() => setIsVisible(true)}
                onError={() => setIsVisible(false)}
            />
        </a>
    )
}
