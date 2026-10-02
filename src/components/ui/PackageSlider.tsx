"use client"

import { Slider } from "@/components/ui/Slider"
import { formatCompactNumber } from "@/lib/formatters"
import { snapToUsagePackage } from "@/lib/subscription/usagePackages"
import type { ComponentProps } from "react"

type PackageSliderProps = Omit<ComponentProps<typeof Slider>, "min" | "max" | "step" | "value" | "onChange" | "onValueCommit" | "name" | "minLabel" | "maxLabel" | "centerLabel"> & {
    packages: readonly number[]
    value: number
    onChange: (value: number) => void
    onValueCommit?: (value: number) => void
}

function formatPackage(value: number, suffix?: string, trailingSuffix?: string) {
    return [formatCompactNumber(value), suffix, trailingSuffix].filter(Boolean).join(" ")
}

export function PackageSlider({ packages, value, onChange, onValueCommit, valueLabelSuffix, centerLabelSuffix, ...props }: PackageSliderProps) {
    const selected = snapToUsagePackage(value, packages)
    const index = Math.max(0, packages.indexOf(selected))
    const lastIndex = Math.max(1, packages.length - 1)
    const toPackage = (position: number) => packages[Math.min(packages.length - 1, Math.max(0, Math.round(position)))] ?? selected

    return (
        <Slider
            {...props}
            min={0}
            max={lastIndex}
            step={1}
            smoothDrag
            disabled={props.disabled || packages.length < 2}
            value={index}
            onChange={(position) => onChange(toPackage(position))}
            onValueCommit={onValueCommit ? (position) => onValueCommit(toPackage(position)) : undefined}
            minLabel={formatPackage(packages[0] ?? selected, valueLabelSuffix)}
            maxLabel={formatPackage(packages[packages.length - 1] ?? selected, valueLabelSuffix)}
            centerLabel={formatPackage(selected, valueLabelSuffix, centerLabelSuffix)}
        />
    )
}
