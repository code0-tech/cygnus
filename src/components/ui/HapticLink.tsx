"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { useWebHaptics } from "web-haptics/react"

type HapticLinkProps = ComponentProps<typeof Link>

export function HapticLink({ onClick, ...props }: HapticLinkProps) {
    const { trigger } = useWebHaptics()

    return (
        <Link
            {...props}
            onClick={(event) => {
                trigger("medium")
                onClick?.(event)
            }}
        />
    )
}
