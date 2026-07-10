"use client"

import { cn } from "@/lib/utils"

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
}

export function Switch<TValue extends string>({ label, description, value, options, onChange, className }: SwitchProps<TValue>) {
    const activeIndex = Math.max(
        options.findIndex((option) => option.value === value),
        0
    )
    const columnCount = Math.max(options.length, 1)

    return (
        <div className={cn("space-y-3", className)}>
            {label || description ? (
                <div>
                    {label ? <p className="text-base text-secondary">{label}</p> : null}
                    {description ? <p className="mt-1 text-sm text-tertiary">{description}</p> : null}
                </div>
            ) : null}
            <div className="relative grid overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-1" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
                <div
                    className="absolute left-1 top-1 h-[calc(100%-0.5rem)] rounded-xl bg-white/10 transition-transform duration-300 ease-out"
                    style={{
                        width: `calc((100% - 0.5rem) / ${columnCount})`,
                        transform: `translateX(${activeIndex * 100}%)`,
                    }}
                />
                {options.map((option) => {
                    const active = value === option.value

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={cn("relative z-10 min-w-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors", active ? "text-white" : "text-secondary hover:text-white")}
                        >
                            <span className="inline-flex min-w-0 items-center justify-center gap-1">
                                <span className="min-w-0 truncate">{option.label}</span>
                                {option.badge && <span className="shrink-0 rounded-full -mt-3 bg-brand/15 px-1 py-0.5 text-[10px] leading-none tracking-wider text-brand">{option.badge}</span>}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
