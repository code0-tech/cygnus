"use client"

import { type ReactNode, useState } from "react"
import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import type { ExtractedActionTriggerItem, ExtractedFunctionDef, ExtractedTrigger } from "@/lib/actionTriggerExtraction"

interface ActionTriggerViewProps {
    locale: string
    triggers: Array<{ item: ExtractedTrigger; icon: ReactNode }>
    functionDefs: Array<{ item: ExtractedFunctionDef; icon: ReactNode }>
}

const itemClassName = "text-secondary! transition-colors! data-[state=on]:bg-brand/20! data-[state=on]:text-brand!"

interface DisplayItem {
    type: "trigger" | "functionDef"
    item: ExtractedActionTriggerItem
    icon: ReactNode
}

export function ActionTriggerView({ locale, triggers, functionDefs }: ActionTriggerViewProps) {
    const [viewMode, setViewMode] = useState<"both" | "triggers" | "functionDefs">("both")

    const visibleItems: DisplayItem[] = [
        ...(viewMode === "both" || viewMode === "triggers" ? triggers.map(({ item, icon }) => ({ type: "trigger" as const, item, icon })) : []),
        ...(viewMode === "both" || viewMode === "functionDefs" ? functionDefs.map(({ item, icon }) => ({ type: "functionDef" as const, item, icon })) : []),
    ]

    return (
        <div className="space-y-6">
            <SegmentedControl
                type="single"
                value={viewMode}
                onValueChange={(value: string) => {
                    if (value === "both" || value === "triggers" || value === "functionDefs") {
                        setViewMode(value)
                    }
                }}
                className={"h-10! w-max!"}
            >
                <SegmentedControlItem value="both" className={itemClassName}>
                    <Text>{locale === "en" ? "Both" : "Beide"}</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="triggers" className={itemClassName}>
                    <Text>Triggers</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="functionDefs" className={itemClassName}>
                    <Text>FunctionDefinitions</Text>
                </SegmentedControlItem>
            </SegmentedControl>

            <div className="flex flex-col gap-4 md:hidden">
                {visibleItems.map(({ type, item, icon }) => (
                    <ActionTriggerCard key={item.id} type={type} item={item} icon={icon} />
                ))}
            </div>
        </div>
    )
}
