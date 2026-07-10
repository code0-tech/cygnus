"use client"

import { type ReactNode, useState } from "react"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import { Switch, type SwitchOption } from "@/components/ui/Switch"
import type { ExtractedActionTriggerItem, ExtractedFunctionDef, ExtractedTrigger } from "@/lib/actionTriggerExtraction"

interface ActionTriggerViewProps {
    locale: string
    triggers: Array<{ item: ExtractedTrigger; icon: ReactNode }>
    functionDefs: Array<{ item: ExtractedFunctionDef; icon: ReactNode }>
}

type ViewMode = "both" | "triggers" | "functionDefs"

interface DisplayItem {
    type: "trigger" | "functionDef"
    item: ExtractedActionTriggerItem
    icon: ReactNode
}

export function ActionTriggerView({ locale, triggers, functionDefs }: ActionTriggerViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("both")
    const viewModeOptions: SwitchOption<ViewMode>[] = [
        { value: "both", label: locale === "en" ? "Both" : "Beide" },
        { value: "triggers", label: "Triggers" },
        { value: "functionDefs", label: "FunctionDefinitions" },
    ]

    const visibleItems: DisplayItem[] = [
        ...(viewMode === "both" || viewMode === "triggers" ? triggers.map(({ item, icon }) => ({ type: "trigger" as const, item, icon })) : []),
        ...(viewMode === "both" || viewMode === "functionDefs" ? functionDefs.map(({ item, icon }) => ({ type: "functionDef" as const, item, icon })) : []),
    ]

    return (
        <div className="space-y-6">
            <Switch value={viewMode} options={viewModeOptions} onChange={setViewMode} className="w-max" />

            <div className="flex flex-col gap-4 md:hidden">
                {visibleItems.map(({ type, item, icon }) => (
                    <ActionTriggerCard key={item.id} type={type} item={item} icon={icon} />
                ))}
            </div>
        </div>
    )
}
