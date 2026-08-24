"use client"

import { cn } from "@/lib/utils"
import { useLayoutEffect, useRef, useState } from "react"

export interface SwitchOption<TValue extends string> {
    value: TValue
    label: string
    badge?: string | null
}

interface SwitchProps<TValue extends string> {
    label?: string
    description?: string
    value: TValue
    options: readonly SwitchOption<TValue>[]
    onChange: (value: TValue) => void
    className?: string
    fitContent?: boolean
}

export function Switch<TValue extends string>({ label, description, value, options, onChange, className, fitContent = false }: SwitchProps<TValue>) {
    const trackRef = useRef<HTMLDivElement>(null)
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
    const [fitIndicator, setFitIndicator] = useState({ left: 4, width: 0 })
    const activeIndex = Math.max(
        options.findIndex((option) => option.value === value),
        0
    )
    const columnCount = Math.max(options.length, 1)

    useLayoutEffect(() => {
        if (!fitContent) return

        const track = trackRef.current
        const activeButton = buttonRefs.current[activeIndex]
        if (!track || !activeButton) return

        const measure = () => {
            setFitIndicator({
                left: activeButton.offsetLeft,
                width: activeButton.offsetWidth,
            })
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(track)
        resizeObserver.observe(activeButton)

        return () => resizeObserver.disconnect()
    }, [activeIndex, fitContent, options])

    return (
        <div className={cn("space-y-3", className)}>
            {(label || description) && (
                <div>
                    {label && <p className="text-base text-secondary">{label}</p>}
                    {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
                </div>
            )}
            <div
                ref={trackRef}
                className="relative grid overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-1"
                style={{ gridTemplateColumns: fitContent ? `repeat(${columnCount}, max-content)` : `repeat(${columnCount}, minmax(0, 1fr))` }}
            >
                {fitContent ? (
                    <div
                        className="pointer-events-none absolute top-1 h-[calc(100%-0.5rem)] rounded-xl bg-light transition-[left,width] duration-300 ease-out"
                        style={{
                            left: fitIndicator.left,
                            width: fitIndicator.width,
                        }}
                    />
                ) : (
                    <div
                        className="absolute left-1 top-1 h-[calc(100%-0.5rem)] rounded-xl bg-light transition-[transform,width] duration-300 ease-out"
                        style={{
                            width: `calc((100% - 0.5rem) / ${columnCount})`,
                            transform: `translateX(${activeIndex * 100}%)`,
                        }}
                    />
                )}
                {options.map((option, index) => {
                    const active = value === option.value

                    return (
                        <button
                            ref={(element) => {
                                buttonRefs.current[index] = element
                            }}
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "relative z-10 grid place-items-center rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                                fitContent ? "min-w-max" : "min-w-0",
                                active ? "text-white" : "text-secondary hover:text-white"
                            )}
                        >
                            <span className={cn("min-w-0", fitContent ? "whitespace-nowrap" : "max-w-[calc(100%-2.25rem)] truncate")}>{option.label}</span>
                            {option.badge && (
                                <span className="absolute left-1/2 top-1/2 ml-6 sm:ml-8 translate-y-[-85%] rounded-full bg-brand/10 border border-brand/10 px-1 py-0.5 text-[10px] leading-none tracking-wider text-brand">
                                    {option.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
