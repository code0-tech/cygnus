"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface PlaygroundFrameProps {
    className?: string
    title: string
    url?: string | null
}

export function PlaygroundFrame({ className, title, url }: PlaygroundFrameProps) {
    const source = url?.trim()
    const [activeSource, setActiveSource] = useState<string | null>(null)
    const frameRef = useRef<HTMLIFrameElement>(null)
    const active = Boolean(source) && activeSource === source

    useEffect(() => {
        if (!active) return

        const deactivate = () => {
            setActiveSource(null)
            frameRef.current?.blur()
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (event.target !== frameRef.current) deactivate()
        }

        // Events inside the iframe belong to its own document and do not reach these listeners.
        window.addEventListener("scroll", deactivate, { capture: true, passive: true })
        window.addEventListener("wheel", deactivate, { passive: true })
        window.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true })

        return () => {
            window.removeEventListener("scroll", deactivate, true)
            window.removeEventListener("wheel", deactivate)
            window.removeEventListener("pointerdown", handlePointerDown, true)
        }
    }, [active])

    if (!source) return null

    return (
        <div className={cn("absolute inset-0 block size-full border-0 bg-primary", className)}>
            <iframe
                ref={frameRef}
                src={source}
                title={title}
                loading="lazy"
                allow="clipboard-read; clipboard-write"
                allowFullScreen
                tabIndex={active ? 0 : -1}
                className={cn("absolute inset-0 block size-full border-0", !active && "pointer-events-none")}
            />
            {!active && (
                <button
                    type="button"
                    aria-label={title}
                    className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                    onClick={() => {
                        setActiveSource(source)
                        frameRef.current?.focus({ preventScroll: true })
                    }}
                />
            )}
        </div>
    )
}
