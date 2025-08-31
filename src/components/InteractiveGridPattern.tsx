"use client";

import { cn } from "@/utils/cn";
import React, { useState } from "react";

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    squares?: [number, number]; // [horizontal, vertical]
    className?: string;
    squaresClassName?: string;
}

export function InteractiveGridPattern({
                                           width = 40,
                                           height = 40,
                                           squares = [24, 24],
                                           className,
                                           squaresClassName,
                                           ...props
                                       }: InteractiveGridPatternProps) {
    const [horizontal, vertical] = squares;
    const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

    return (
        <svg
            width={width * horizontal}
            height={height * vertical}
            className={cn(
                "absolute inset-0 h-full w-full border border-gray-400/30 opacity-40",
                className,
            )}
            {...props}
        >
            {Array.from({ length: horizontal * vertical }).map((_, index) => {
                const x = (index % horizontal) * width;
                const y = Math.floor(index / horizontal) * height;
                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        className={cn(
                            "stroke-gray-400/30 transition-all duration-100 ease-in-out [&:not(:hover)]:duration-1000",
                            hoveredSquare === index ? "fill-gray-300/30" : "fill-transparent",
                            squaresClassName,
                        )}
                        onMouseEnter={() => setHoveredSquare(index)}
                        onMouseLeave={() => setHoveredSquare(null)}
                    />
                );
            })}
        </svg>
    );
}
