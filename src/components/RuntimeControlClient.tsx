"use client"

import { useState } from "react"
import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"

export function RuntimeControlClient() {
    const [runtimeType, setRuntimeType] = useState("static")
    const [executionType, setExecutionType] = useState("compiled")

    const controlClassName = "w-max! h-12! md:h-10! xl:h-12! ring-2! ring-white/2! shadow-md!"
    const textClassName = "text-inherit! text-xl! md:text-base! xl:text-xl!"

    return (
        <div className="h-full flex flex-col items-center justify-center gap-4">
            <SegmentedControl
                type="single"
                value={runtimeType}
                onValueChange={(value) => {
                    if (value) setRuntimeType(value)
                }}
                className={controlClassName}
            >
                <SegmentedControlItem
                    value="dynamic"
                    className="text-white/75! transition-colors! data-[state=on]:bg-brand/20! data-[state=on]:text-brand!"
                >
                    <Text className={textClassName}>Dynamic</Text>
                </SegmentedControlItem>
                <SegmentedControlItem
                    value="static"
                    className="text-white/75! transition-colors! data-[state=on]:bg-yellow/20! data-[state=on]:text-yellow!"
                >
                    <Text className={textClassName}>Static</Text>
                </SegmentedControlItem>
            </SegmentedControl>

            <SegmentedControl
                type="single"
                value={executionType}
                onValueChange={(value) => {
                    if (value) setExecutionType(value)
                }}
                className={controlClassName}
            >
                <SegmentedControlItem
                    value="compiled"
                    className="text-white/75! transition-colors! data-[state=on]:bg-pink/20! data-[state=on]:text-pink!"
                >
                    <Text className={textClassName}>Compiled</Text>
                </SegmentedControlItem>
                <SegmentedControlItem
                    value="interpreted"
                    className="text-white/75! transition-colors! data-[state=on]:bg-aqua/20! data-[state=on]:text-aqua!"
                >
                    <Text className={textClassName}>Interpreted</Text>
                </SegmentedControlItem>
            </SegmentedControl>
        </div>
    )
}
