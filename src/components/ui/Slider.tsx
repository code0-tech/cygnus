"use client"

import { cn } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState } from "react"

type SliderAccent = "aqua" | "blue" | "pink" | "yellow" | "brand"

type SliderProps = {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    accent?: SliderAccent
    className?: string
    lines?: number
    minLabel?: string
    maxLabel?: string
    centerLabel?: string
}

export function Slider({
    min,
    max,
    step = 1,
    value,
    onChange,
    accent = "aqua",
    className,
    lines = 48,
    minLabel,
    maxLabel,
    centerLabel,
}: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const clampedValue = Math.min(max, Math.max(min, value))
    const progress = ((clampedValue - min) / (max - min)) * 100

    const ticks = useMemo(() => Array.from({ length: lines }, (_, index) => index), [lines])
    const majorTickIndexes = useMemo(() => new Set([
        0,
        Math.round((lines - 1) * 0.25),
        Math.round((lines - 1) * 0.5),
        Math.round((lines - 1) * 0.75),
        lines - 1
    ]), [lines])

    function snapValue(nextValue: number) {
        const stepped = Math.round((nextValue - min) / step) * step + min
        return Math.min(max, Math.max(min, stepped))
    }

    function updateFromClientX(clientX: number) {
        const track = trackRef.current
        if (!track) return

        const rect = track.getBoundingClientRect()
        const ratio = (clientX - rect.left) / rect.width
        const nextValue = min + ratio * (max - min)
        onChange(snapValue(nextValue))
    }

    useEffect(() => {
        if (!isDragging) return

        function handlePointerMove(event: PointerEvent) {
            updateFromClientX(event.clientX)
        }

        function handlePointerUp() {
            setIsDragging(false)
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }
    }, [isDragging])

    return (
        <div className={cn("w-full", className)}>
            <div
                ref={trackRef}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={clampedValue}
                tabIndex={0}
                onPointerDown={(event) => {
                    setIsDragging(true)
                    updateFromClientX(event.clientX)
                }}
                onKeyDown={(event) => {
                    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                        event.preventDefault()
                        onChange(snapValue(clampedValue - step))
                    }
                    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                        event.preventDefault()
                        onChange(snapValue(clampedValue + step))
                    }
                }}
                className="relative h-14 cursor-pointer touch-none outline-none"
            >
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                    <div className="grid h-12 items-center grid-flow-col gap-1">
                        {ticks.map((tick) => {
                            const tickProgress = (tick / Math.max(lines - 1, 1)) * 100
                            const active = tickProgress <= progress
                            const isMajor = majorTickIndexes.has(tick)
                            const heightRatio = lines <= 1 ? 1 : tick / (lines - 1)
                            const baseHeight = 8 + (heightRatio * 28)
                            const tickHeight = isMajor ? Math.min(baseHeight + 8, 40) : baseHeight
                            const gradientSpan = `${Math.max(lines, 1) * 100}% 100%`
                            const gradientOffset = `${(tick / Math.max(lines - 1, 1)) * 100}% 50%`

                            return (
                                <div
                                    key={tick}
                                    className={cn("w-full rounded-full transition-[height,opacity,background-image] duration-200")}
                                    style={{
                                        height: `${tickHeight}px`,
                                        opacity: active ? 1 : 0.45,
                                        backgroundColor: active ? "transparent" : "rgba(255,255,255,0.18)",
                                        backgroundImage: active
                                            ? "linear-gradient(to right, rgba(255,107,107,0.9) 0%, rgba(255,184,107,0.92) 45%, rgba(114,248,150,0.95) 100%)"
                                            : undefined,
                                        backgroundSize: active ? gradientSpan : undefined,
                                        backgroundPosition: active ? gradientOffset : undefined,
                                        backgroundRepeat: active ? "no-repeat" : undefined,
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>

            </div>

            <div className="mt-2 grid grid-cols-3 text-xs text-white/38">
                <span>{minLabel ?? min}</span>
                <span className="relative tabular-nums text-center text-base text-white">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-20 rounded-full bg-white/25 blur-xl"
                    />
                    {centerLabel}
                </span>
                <span className="text-right">{maxLabel ?? max}</span>
            </div>
        </div>
    )
}
