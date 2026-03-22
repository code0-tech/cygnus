"use client"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import React, { useState } from "react"

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
    width?: number
    height?: number
    squares?: [number, number]
    className?: string
    squaresClassName?: string
}

export function InteractiveGridPattern({width = 40, height = 40, squares = [24, 24], className, squaresClassName, ...props}: InteractiveGridPatternProps) {
    const [horizontal, vertical] = squares
    const [hoveredSquare, setHoveredSquare] = useState<number | null>(null)
    const supportsHover = useMediaQuery("(hover: hover) and (pointer: fine)")

    return (
        <svg
            width={width * horizontal}
            height={height * vertical}
            className={cn(
                "absolute inset-0 h-full w-full border border-gray-400/30 opacity-40",
                !supportsHover && "pointer-events-none",
                className,
            )}
            {...props}
        >
            {Array.from({ length: horizontal * vertical }).map((_, index) => {
                const x = (index % horizontal) * width
                const y = Math.floor(index / horizontal) * height
                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        className={cn(
                            "stroke-gray-400/30 transition-colors duration-100 ease-in-out not-[&:hover]:duration-1000",
                            hoveredSquare === index ? "fill-gray-300/30" : "fill-transparent",
                            squaresClassName,
                        )}
                        onMouseEnter={supportsHover ? () => setHoveredSquare(index) : undefined}
                        onMouseLeave={supportsHover ? () => setHoveredSquare(null) : undefined}
                    />
                )
            })}
        </svg>
    )
}
