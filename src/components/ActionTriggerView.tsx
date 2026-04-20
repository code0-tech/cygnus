"use client"

import { useState } from "react"
import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"
import type { Media } from "@/payload-types"
import { cn } from "@/lib/utils"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"

interface ActionTriggerViewProps {
    triggers: Media | undefined
    functionDefs: Media | undefined
}

const controlClassName = "h-10! w-max! ring-2! ring-white/6! shadow-md!"
const itemClassName = "text-white/70! transition-colors! data-[state=on]:bg-brand/20! data-[state=on]:text-brand!"

export function ActionTriggerView({ triggers, functionDefs }: ActionTriggerViewProps) {
    const [viewMode, setViewMode] = useState<"both" | "triggers" | "functionDefs">("both")

    const extractedTriggers: any[] = []
    const extractedFunctionDefs: any[] = []

    return (
        <div className="space-y-6">
            <SegmentedControl
                type="single"
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "both" | "triggers" | "functionDefs")}
                className={controlClassName}
            >
                <SegmentedControlItem value="both" className={itemClassName}>
                    <Text>Beide</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="triggers" className={itemClassName}>
                    <Text>Triggers</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="functionDefs" className={itemClassName}>
                    <Text>FunctionDefs</Text>
                </SegmentedControlItem>
            </SegmentedControl>

            <div className={"grid gap-4 md:grid-cols-2 grid-cols-1"}>
                {(viewMode === "both" || viewMode === "triggers") && (
                    <>
                        {extractedTriggers.map((trigger) => (
                            <ActionTriggerCard type="trigger" item={trigger} />
                        ))}
                    </>
                )}
                {(viewMode === "both" || viewMode === "functionDefs") && (
                    <>
                        {extractedFunctionDefs.map((functionDef) => (
                            <ActionTriggerCard type="functionDef" item={functionDef} />
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
