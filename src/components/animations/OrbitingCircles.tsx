import React from "react"
import { cn } from "@/lib/utils"

interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
    children?: React.ReactElement | React.ReactElement[]
    reverse?: boolean
    duration?: number
    delay?: number
    radius?: number
    path?: boolean
    iconSize?: number
    speed?: number
}

export function OrbitingCircles({ className, children, reverse, duration = 20, radius = 160, path = true, iconSize = 30, speed = 1, ...props }: OrbitingCirclesProps) {
    const calculatedDuration = duration / speed
    const orbitItems = React.Children.toArray(children)

    return (
        <>
            {path && (
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="pointer-events-none absolute inset-0 size-full">
                    <circle className="stroke-white/10 stroke-1" cx="50%" cy="50%" r={radius} fill="none" />
                </svg>
            )}
            {orbitItems.map((child, index) => (
                <div key={React.isValidElement(child) ? child.key : String(child)} className="absolute inset-0 flex items-center justify-center text-white">
                    <div
                        style={
                            {
                                "--duration": calculatedDuration,
                                "--radius": radius,
                                "--angle": (360 / orbitItems.length) * index,
                                "--icon-size": `${iconSize}px`,
                            } as React.CSSProperties
                        }
                        className={cn("animate-orbit flex size-(--icon-size) transform-gpu items-center justify-center rounded-full", reverse && "direction-[reverse]", className)}
                        {...props}
                    >
                        {child}
                    </div>
                </div>
            ))}
        </>
    )
}
