"use client"

import { cn } from "@/lib/utils"
import { useCallback, useMemo, useRef } from "react"

type SliderProps = {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    className?: string
    lines?: number
    minLabel?: string
    maxLabel?: string
    centerLabel?: string
    ariaLabel?: string
    valueLabelSuffix?: string
    centerLabelSuffix?: string
}

function formatCompactSliderValue(value: number) {
    const absoluteValue = Math.abs(value)
    const compactUnits = [
        { suffix: "B", value: 1_000_000_000 },
        { suffix: "M", value: 1_000_000 },
        { suffix: "K", value: 1_000 },
    ]
    const unit = compactUnits.find((compactUnit) => absoluteValue >= compactUnit.value)

    if (!unit) return String(value)

    const compactValue = value / unit.value
    const maximumFractionDigits = Number.isInteger(compactValue) ? 0 : 1

    return `${compactValue.toLocaleString("en-US", { maximumFractionDigits })}${unit.suffix}`
}

function formatSliderLabel(value: number, suffix?: string, trailingSuffix = "") {
    return `${formatCompactSliderValue(value)}${suffix ? ` ${suffix}` : ""}${trailingSuffix ? ` ${trailingSuffix}` : ""}`
}

export function Slider({ min, max, step = 1, value, onChange, className, lines = 72, minLabel, maxLabel, centerLabel, ariaLabel, valueLabelSuffix, centerLabelSuffix = "" }: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const clampedValue = Math.min(max, Math.max(min, value))
    const progress = ((clampedValue - min) / (max - min)) * 100
    const resolvedMinLabel = minLabel ?? formatSliderLabel(min, valueLabelSuffix)
    const resolvedCenterLabel = centerLabel ?? formatSliderLabel(clampedValue, valueLabelSuffix, centerLabelSuffix)
    const resolvedMaxLabel = maxLabel ?? formatSliderLabel(max, valueLabelSuffix)

    const ticks = useMemo(() => Array.from({ length: lines }, (_, index) => index), [lines])
    const majorTickIndexes = useMemo(() => new Set([0, Math.round((lines - 1) * 0.25), Math.round((lines - 1) * 0.5), Math.round((lines - 1) * 0.75), lines - 1]), [lines])

    const snapValue = useCallback(
        (nextValue: number) => {
            const stepped = Math.round((nextValue - min) / step) * step + min
            return Math.min(max, Math.max(min, stepped))
        },
        [max, min, step]
    )

    const updateFromClientX = useCallback(
        (clientX: number) => {
            const track = trackRef.current
            if (!track) return

            const rect = track.getBoundingClientRect()
            const ratio = (clientX - rect.left) / rect.width
            const nextValue = min + ratio * (max - min)
            onChange(snapValue(nextValue))
        },
        [max, min, onChange, snapValue]
    )

    return (
        <div className={cn("w-full", className)}>
            <div
                ref={trackRef}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={clampedValue}
                aria-label={ariaLabel}
                tabIndex={0}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    updateFromClientX(event.clientX)
                }}
                onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        updateFromClientX(event.clientX)
                    }
                }}
                onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId)
                    }
                }}
                onPointerCancel={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId)
                    }
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
                            const baseHeight = 8 + heightRatio * 28
                            const tickHeight = isMajor ? Math.min(baseHeight + 4, 40) : baseHeight
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
                                        backgroundImage: active ? "linear-gradient(to right, rgba(255,107,107,0.9) 0%, rgba(255,184,107,0.92) 45%, rgba(114,248,150,0.95) 100%)" : undefined,
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

            <div className="mt-2 grid grid-cols-3 text-xs text-tertiary">
                <span>{resolvedMinLabel}</span>
                <span className="relative tabular-nums text-center text-base text-white">
                    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-20 rounded-full bg-white/25 blur-xl" />
                    {resolvedCenterLabel}
                </span>
                <span className="text-right">{resolvedMaxLabel}</span>
            </div>
        </div>
    )
}
