"use client"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import React, { useId, useState } from "react"

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
    width?: number
    height?: number
    squares?: [number, number]
    className?: string
    squaresClassName?: string
}

export function InteractiveGridPattern({ width = 40, height = 40, squares = [24, 24], className, squaresClassName, ...props }: InteractiveGridPatternProps) {
    const [horizontal, vertical] = squares
    const [hoveredSquare, setHoveredSquare] = useState<number | null>(null)
    const supportsHover = useMediaQuery("(hover: hover) and (pointer: fine)")
    const patternId = useId()

    return (
        <svg
            width={width * horizontal}
            height={height * vertical}
            className={cn("absolute inset-0 h-full w-full border border-gray-400/30", !supportsHover && "pointer-events-none", className)}
            {...props}
        >
            {supportsHover ? (
                Array.from({ length: horizontal * vertical }).map((_, index) => {
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
                                "stroke-gray-400/10 transition-colors duration-100 ease-in-out not-[&:hover]:duration-1000",
                                hoveredSquare === index ? "fill-gray-300/20" : "fill-transparent",
                                squaresClassName
                            )}
                            onMouseEnter={() => setHoveredSquare(index)}
                            onMouseLeave={() => setHoveredSquare(null)}
                        />
                    )
                })
            ) : (
                <>
                    <defs>
                        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse">
                            <path d={`M ${width} 0 L 0 0 0 ${height}`} fill="none" className={cn("stroke-gray-400/10", squaresClassName)} />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                </>
            )}
        </svg>
    )
}
