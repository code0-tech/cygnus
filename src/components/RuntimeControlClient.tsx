"use client"

import { useState } from "react"
import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"
import { cn } from "@/lib/utils"

const runtimeStyles = {
    dynamic: "left-[29%] top-[26%] bg-brand/20",
    static: "left-[71%] top-[26%] bg-yellow/20",
} as const

const executionStyles = {
    compiled: "left-[29%] top-[74%] bg-pink/20",
    interpreted: "left-[71%] top-[74%] bg-aqua/20",
} as const

type RuntimeType = keyof typeof runtimeStyles
type ExecutionType = keyof typeof executionStyles

export function RuntimeControlClient() {
    const [runtimeType, setRuntimeType] = useState<RuntimeType>("static")
    const [executionType, setExecutionType] = useState<ExecutionType>("compiled")
    const controlClassName = "w-max! h-10! sm:h-12! md:h-10! xl:h-12! ring-2! ring-white/2! shadow-md!"
    const textClassName = "text-inherit! text-base! sm:text-xl! md:text-base! xl:text-xl!"

    return (
        <>
            <div className={cn("pointer-events-none absolute h-40 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-[top,left,background-color] duration-500", runtimeStyles[runtimeType])}/>
            <div className={cn("pointer-events-none absolute h-40 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-[top,left,background-color] duration-500", executionStyles[executionType])}/>
            <div className="relative z-10 px-2 py-3">
                <div className="h-full flex flex-col items-center justify-center gap-2 sm:gap-4">
                    <SegmentedControl
                        type="single"
                        value={runtimeType}
                        onValueChange={(value) => {
                            if (value) setRuntimeType(value as RuntimeType)
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
                            if (value) setExecutionType(value as ExecutionType)
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
            </div>
        </>
    )
}
