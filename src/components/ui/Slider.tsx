"use client"

import { formatCompactNumber } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SliderSize = "sm" | "md" | "lg"

const SLIDER_SIZE_STYLES = {
    sm: { track: "h-12", label: "text-[0.6875rem]", baseHeight: 18, coneMinHeight: 6, coneHeightRange: 20, majorHeight: 24, coneMajorMax: 30 },
    md: { track: "h-16", label: "text-xs", baseHeight: 24, coneMinHeight: 8, coneHeightRange: 28, majorHeight: 32, coneMajorMax: 40 },
    lg: { track: "h-20", label: "text-sm", baseHeight: 30, coneMinHeight: 10, coneHeightRange: 36, majorHeight: 40, coneMajorMax: 50 },
} satisfies Record<SliderSize, Record<string, string | number>>

type SliderProps = {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    onValueCommit?: (value: number) => void
    name?: string
    disabled?: boolean
    size?: SliderSize
    className?: string
    lines?: number
    minLabel?: string
    maxLabel?: string
    centerLabel?: string
    ariaLabel?: string
    valueLabelSuffix?: string
    centerLabelSuffix?: string
    variant?: "default" | "gradient"
    activeColor?: string
    inactiveColor?: string
    shape?: "default" | "cone-incline" | "cone-decline"
    showMajorLines?: boolean
    majorLines?: number[]
    animationSpeed?: number
}

function formatSliderLabel(value: number, suffix?: string, trailingSuffix = "") {
    return `${formatCompactNumber(value)}${suffix ? ` ${suffix}` : ""}${trailingSuffix ? ` ${trailingSuffix}` : ""}`
}

function getDecimalPlaces(value: number) {
    const [coefficient, exponent = "0"] = String(value).toLowerCase().split("e")
    const decimals = coefficient.split(".")[1]?.length ?? 0
    return Math.max(0, decimals - Number(exponent))
}

function getDefaultLines() {
    if (typeof window === "undefined") return 56
    if (window.matchMedia("(min-width: 1280px)").matches) return 56
    if (window.matchMedia("(min-width: 768px)").matches) return 48
    return 36
}

export function Slider({
    min,
    max,
    step = 1,
    value,
    onChange,
    onValueCommit,
    name,
    disabled = false,
    size = "md",
    className,
    lines,
    minLabel,
    maxLabel,
    centerLabel,
    ariaLabel,
    valueLabelSuffix,
    centerLabelSuffix = "",
    variant = "default",
    activeColor = "currentColor",
    inactiveColor = "rgba(255,255,255,0.18)",
    shape = "default",
    showMajorLines = true,
    majorLines,
    animationSpeed = 240,
}: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const pointerStartXRef = useRef(0)
    const didDragRef = useRef(false)
    const stretchOriginRef = useRef<"left center" | "right center">("left center")
    const pointerPositionRef = useRef<number | null>(null)
    const stickyMajorLineRef = useRef<number | null>(null)
    const commitStartValueRef = useRef(value)
    const pendingValueRef = useRef(value)
    const [responsiveLines, setResponsiveLines] = useState(lines ?? 56)

    const resolvedMin = Number.isFinite(min) ? min : 0
    const resolvedStep = Number.isFinite(step) && step > 0 ? step : 1
    const resolvedMax = Number.isFinite(max) && max > resolvedMin ? max : resolvedMin + resolvedStep
    const resolvedValue = Number.isFinite(value) ? value : resolvedMin
    const clampedValue = Math.min(resolvedMax, Math.max(resolvedMin, resolvedValue))
    const requestedLines = lines ?? responsiveLines
    const lineCount = Math.min(512, Math.max(2, Math.floor(Number.isFinite(requestedLines) ? requestedLines : 48)))
    const resolvedAnimationSpeed = Math.min(2_000, Number.isFinite(animationSpeed) && animationSpeed > 0 ? animationSpeed : 240)
    const range = resolvedMax - resolvedMin
    const progress = (clampedValue - resolvedMin) / range
    const activePosition = progress * (lineCount - 1)
    const animatedPositionRef = useRef(activePosition)
    const springVelocityRef = useRef(0)
    const [animatedPosition, setAnimatedPosition] = useState(activePosition)
    const [isDragging, setIsDragging] = useState(false)
    const [overscrollStretch, setOverscrollStretch] = useState(0)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const shouldAnimate = !isDragging && !prefersReducedMotion
    const visiblePosition = shouldAnimate ? animatedPosition : activePosition
    const sizeStyles = SLIDER_SIZE_STYLES[size] ?? SLIDER_SIZE_STYLES.md
    const resolvedMajorLines = useMemo(() => {
        const defaultMajorLines = [0, Math.round((lineCount - 1) / 4), Math.round((lineCount - 1) / 2), Math.round(((lineCount - 1) * 3) / 4), lineCount - 1]
        const lineIndexes = majorLines ?? defaultMajorLines

        return Array.from(new Set(lineIndexes.filter(Number.isFinite).map((line) => Math.min(lineCount - 1, Math.max(0, Math.round(line)))))).sort((first, second) => first - second)
    }, [lineCount, majorLines])
    const majorLineIndexes = useMemo(() => new Set(resolvedMajorLines), [resolvedMajorLines])
    const resolvedMinLabel = minLabel ?? formatSliderLabel(resolvedMin, valueLabelSuffix)
    const resolvedCenterLabel = centerLabel ?? formatSliderLabel(clampedValue, valueLabelSuffix, centerLabelSuffix)
    const resolvedMaxLabel = maxLabel ?? formatSliderLabel(resolvedMax, valueLabelSuffix)

    pendingValueRef.current = clampedValue

    const getPositionForValue = useCallback((nextValue: number) => ((nextValue - resolvedMin) / range) * (lineCount - 1), [lineCount, range, resolvedMin])

    const syncAnimatedPosition = useCallback(
        (nextValue: number) => {
            const nextPosition = getPositionForValue(nextValue)
            animatedPositionRef.current = nextPosition
            springVelocityRef.current = 0
            setAnimatedPosition(nextPosition)
        },
        [getPositionForValue]
    )

    useEffect(() => {
        if (lines !== undefined) {
            setResponsiveLines(lines)
            return
        }

        const mediaQueries = [window.matchMedia("(min-width: 1280px)"), window.matchMedia("(min-width: 768px)")]
        const updateLines = () => setResponsiveLines(getDefaultLines())

        updateLines()
        mediaQueries.forEach((mediaQuery) => mediaQuery.addEventListener("change", updateLines))

        return () => {
            mediaQueries.forEach((mediaQuery) => mediaQuery.removeEventListener("change", updateLines))
        }
    }, [lines])

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

        updatePreference()
        mediaQuery.addEventListener("change", updatePreference)
        return () => mediaQuery.removeEventListener("change", updatePreference)
    }, [])

    useEffect(() => {
        if (!shouldAnimate) {
            springVelocityRef.current = 0
            if (animatedPositionRef.current !== activePosition) {
                animatedPositionRef.current = activePosition
                setAnimatedPosition(activePosition)
            }
            return
        }

        if (Math.abs(animatedPositionRef.current - activePosition) < 0.001 && Math.abs(springVelocityRef.current) < 0.01) return

        let animationFrame = 0
        let previousTime = performance.now()
        const stiffness = resolvedAnimationSpeed
        const damping = 2 * Math.sqrt(stiffness) * 0.82

        const animate = (currentTime: number) => {
            const elapsedSeconds = Math.min(currentTime - previousTime, 32) / 1000
            previousTime = currentTime
            const substeps = Math.max(1, Math.ceil(elapsedSeconds / 0.008))
            const stepTime = elapsedSeconds / substeps
            let nextPosition = animatedPositionRef.current
            let velocity = springVelocityRef.current

            for (let stepIndex = 0; stepIndex < substeps; stepIndex += 1) {
                const acceleration = stiffness * (activePosition - nextPosition) - damping * velocity
                velocity += acceleration * stepTime
                nextPosition += velocity * stepTime
            }

            const isSettled = Math.abs(activePosition - nextPosition) < 0.001 && Math.abs(velocity) < 0.01

            if (isSettled) {
                nextPosition = activePosition
                velocity = 0
            }

            animatedPositionRef.current = nextPosition
            springVelocityRef.current = velocity
            setAnimatedPosition(nextPosition)

            if (!isSettled) animationFrame = window.requestAnimationFrame(animate)
        }

        animationFrame = window.requestAnimationFrame(animate)
        return () => window.cancelAnimationFrame(animationFrame)
    }, [activePosition, resolvedAnimationSpeed, shouldAnimate])

    const updateValue = useCallback(
        (nextValue: number) => {
            const steppedValue = Math.round((nextValue - resolvedMin) / resolvedStep) * resolvedStep + resolvedMin
            const precision = Math.max(getDecimalPlaces(resolvedMin), getDecimalPlaces(resolvedStep))
            const roundedValue = Number(steppedValue.toFixed(precision))
            const nextResolvedValue = Math.min(resolvedMax, Math.max(resolvedMin, roundedValue))

            if (nextResolvedValue === pendingValueRef.current) return nextResolvedValue

            pendingValueRef.current = nextResolvedValue
            onChange(nextResolvedValue)
            return nextResolvedValue
        },
        [onChange, resolvedMax, resolvedMin, resolvedStep]
    )

    const updateFromPointer = useCallback(
        (clientX: number, applyMajorLineStickiness = false) => {
            const track = trackRef.current
            if (!track) return

            const bounds = track.getBoundingClientRect()
            if (bounds.width <= 0) return
            const overflow = clientX < bounds.left ? clientX - bounds.left : clientX > bounds.right ? clientX - bounds.right : 0
            const resistedOverflow = Math.sign(overflow) * (1 - Math.exp(-Math.abs(overflow) / 56))

            if (overflow < 0) stretchOriginRef.current = "right center"
            if (overflow > 0) stretchOriginRef.current = "left center"
            setOverscrollStretch(prefersReducedMotion ? 0 : resistedOverflow)

            const rawPosition = Math.min(lineCount - 1, Math.max(0, ((clientX - bounds.left) / bounds.width) * (lineCount - 1)))
            const previousPosition = pointerPositionRef.current
            let nextPosition = rawPosition
            let releasedStickyLine = false

            if (applyMajorLineStickiness && showMajorLines) {
                const stickyLine = stickyMajorLineRef.current

                if (stickyLine !== null) {
                    if (Math.abs(rawPosition - stickyLine) <= 0.9) {
                        nextPosition = stickyLine
                    } else {
                        stickyMajorLineRef.current = null
                        releasedStickyLine = true
                    }
                }

                if (stickyMajorLineRef.current === null && !releasedStickyLine) {
                    const crossedLine =
                        previousPosition === null
                            ? undefined
                            : resolvedMajorLines
                                  .filter((line) => (previousPosition - line) * (rawPosition - line) <= 0)
                                  .sort((first, second) => Math.abs(first - previousPosition) - Math.abs(second - previousPosition))[0]
                    const nearbyLine = resolvedMajorLines.reduce<number | undefined>((nearestLine, line) => {
                        if (Math.abs(rawPosition - line) > 0.3) return nearestLine
                        if (nearestLine === undefined || Math.abs(rawPosition - line) < Math.abs(rawPosition - nearestLine)) return line
                        return nearestLine
                    }, undefined)
                    const capturedLine = crossedLine ?? nearbyLine

                    if (capturedLine !== undefined) {
                        stickyMajorLineRef.current = capturedLine
                        nextPosition = capturedLine
                    }
                }
            }

            pointerPositionRef.current = rawPosition
            updateValue(resolvedMin + (nextPosition / (lineCount - 1)) * range)
        },
        [lineCount, prefersReducedMotion, range, resolvedMajorLines, resolvedMin, showMajorLines, updateValue]
    )

    return (
        <div className={cn("w-full", className)}>
            {name ? <input type="hidden" name={name} value={clampedValue} disabled={disabled} /> : null}

            <div
                ref={trackRef}
                role="slider"
                aria-label={ariaLabel ?? "Slider"}
                aria-valuemin={resolvedMin}
                aria-valuemax={resolvedMax}
                aria-valuenow={clampedValue}
                aria-valuetext={resolvedCenterLabel}
                aria-disabled={disabled || undefined}
                className={cn("flex touch-none items-center select-none outline-none", sizeStyles.track, disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer active:cursor-grabbing")}
                tabIndex={disabled ? -1 : 0}
                onPointerDown={(event) => {
                    if (disabled) return
                    event.preventDefault()
                    event.currentTarget.focus({ preventScroll: true })
                    pointerStartXRef.current = event.clientX
                    didDragRef.current = false
                    pointerPositionRef.current = null
                    stickyMajorLineRef.current = null
                    commitStartValueRef.current = clampedValue
                    pendingValueRef.current = clampedValue
                    event.currentTarget.setPointerCapture(event.pointerId)
                    updateFromPointer(event.clientX)
                }}
                onPointerMove={(event) => {
                    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return
                    if (!didDragRef.current && Math.abs(event.clientX - pointerStartXRef.current) < 4) return

                    didDragRef.current = true
                    setIsDragging(true)
                    updateFromPointer(event.clientX, true)
                }}
                onPointerUp={(event) => {
                    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return

                    const committedValue = pendingValueRef.current
                    if (didDragRef.current) syncAnimatedPosition(committedValue)
                    setOverscrollStretch(0)
                    setIsDragging(false)
                    pointerPositionRef.current = null
                    stickyMajorLineRef.current = null
                    event.currentTarget.releasePointerCapture(event.pointerId)
                    if (committedValue !== commitStartValueRef.current) onValueCommit?.(committedValue)
                }}
                onPointerCancel={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return

                    syncAnimatedPosition(pendingValueRef.current)
                    setOverscrollStretch(0)
                    setIsDragging(false)
                    pointerPositionRef.current = null
                    stickyMajorLineRef.current = null
                    event.currentTarget.releasePointerCapture(event.pointerId)
                }}
                onKeyDown={(event) => {
                    if (disabled) return
                    const keyValues: Record<string, number> = {
                        ArrowLeft: clampedValue - resolvedStep,
                        ArrowDown: clampedValue - resolvedStep,
                        ArrowRight: clampedValue + resolvedStep,
                        ArrowUp: clampedValue + resolvedStep,
                        PageDown: clampedValue - resolvedStep * 10,
                        PageUp: clampedValue + resolvedStep * 10,
                        Home: resolvedMin,
                        End: resolvedMax,
                    }

                    if (keyValues[event.key] !== undefined) {
                        event.preventDefault()
                        const nextValue = updateValue(keyValues[event.key])
                        if (nextValue !== clampedValue) onValueCommit?.(nextValue)
                    }
                }}
                onDragStart={(event) => event.preventDefault()}
            >
                <div
                    aria-hidden="true"
                    className={cn(
                        "flex w-full transform-gpu items-center gap-1 transition-transform motion-reduce:transition-none",
                        overscrollStretch === 0 ? "duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : "duration-75 ease-out"
                    )}
                    style={{
                        transform: `scaleX(${1 + Math.abs(overscrollStretch) * 0.02})`,
                        transformOrigin: stretchOriginRef.current,
                    }}
                >
                    {Array.from({ length: lineCount }, (_, index) => {
                        const distanceFromValue = Math.abs(index - visiblePosition)
                        const waveStrength = Math.exp(-(distanceFromValue ** 2) / (2 * 1.15 ** 2))
                        const scale = 1 + waveStrength * 0.5
                        const activation = Math.min(1, Math.max(0, visiblePosition - index + 1))
                        const lineProgress = index / (lineCount - 1)
                        const edgeInfluence = overscrollStretch > 0 ? lineProgress ** 2 : (1 - lineProgress) ** 2
                        const edgeScale = overscrollStretch > 0 ? 1 + Math.abs(overscrollStretch) * edgeInfluence * 0.14 : 1 - Math.abs(overscrollStretch) * edgeInfluence * 0.08
                        const coneProgress = shape === "cone-decline" ? 1 - lineProgress : lineProgress
                        const baseHeight = shape === "default" ? sizeStyles.baseHeight : sizeStyles.coneMinHeight + coneProgress * sizeStyles.coneHeightRange
                        const isMajorLine = showMajorLines && majorLineIndexes.has(index)
                        const lineHeight = isMajorLine ? (shape === "default" ? sizeStyles.majorHeight : Math.min(baseHeight + 4, sizeStyles.coneMajorMax)) : baseHeight

                        return (
                            <span
                                key={index}
                                className="relative flex-1 origin-center overflow-hidden rounded-full transition-[opacity,transform] duration-75 ease-out motion-reduce:transition-none"
                                style={{
                                    height: `${lineHeight}px`,
                                    backgroundColor: inactiveColor,
                                    opacity: 0.4 + activation * 0.6,
                                    transform: `scaleY(${scale * edgeScale})`,
                                    transitionDuration: shouldAnimate ? undefined : "0ms",
                                    transitionProperty: shouldAnimate ? undefined : "none",
                                }}
                            >
                                <span
                                    className="absolute inset-0 rounded-[inherit] transition-opacity duration-75 ease-out motion-reduce:transition-none"
                                    style={{
                                        opacity: activation,
                                        transitionDuration: shouldAnimate ? undefined : "0ms",
                                        backgroundColor: variant === "default" ? activeColor : undefined,
                                        ...(variant === "gradient"
                                            ? {
                                                  backgroundImage: "linear-gradient(to right, #ff6b6b, #ffb86b, #72f896)",
                                                  backgroundPosition: `${lineProgress * 100}% center`,
                                                  backgroundSize: `${lineCount * 100}% 100%`,
                                              }
                                            : {}),
                                    }}
                                />
                            </span>
                        )
                    })}
                </div>
            </div>

            <div className={cn("mt-2 grid grid-cols-3 text-tertiary", sizeStyles.label)}>
                <span>{resolvedMinLabel}</span>
                <span className="relative min-w-32 whitespace-nowrap text-center text-sm tabular-nums text-white sm:text-base">
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 h-4 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-xl" />
                    {resolvedCenterLabel}
                </span>
                <span className="text-right">{resolvedMaxLabel}</span>
            </div>
        </div>
    )
}
