"use client"

import { useState } from "react"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import { Switch, type SwitchOption } from "@/components/ui/Switch"
import type { ExtractedFlowType, ExtractedFunctionDefinition } from "@/lib/actionExtraction"

interface ActionTriggerViewProps {
    locale: string
    flowTypes: Array<{ item: ExtractedFlowType; icon?: string }>
    functionDefinitions: Array<{ item: ExtractedFunctionDefinition; icon?: string }>
    emptyLabels: {
        flowTypes: string
        functionDefinitions: string
        both: string
    }
}

type ViewMode = "both" | "flowTypes" | "functionDefinitions"

interface DisplayItem {
    type: "flowType" | "functionDefinition"
    item: ExtractedFlowType | ExtractedFunctionDefinition
    icon?: string
}

export function ActionTriggerView({ locale, flowTypes, functionDefinitions, emptyLabels }: ActionTriggerViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("both")
    const viewModeOptions: SwitchOption<ViewMode>[] = [
        { value: "flowTypes", label: "FlowTypes" },
        { value: "functionDefinitions", label: "FunctionDefinitions" },
        { value: "both", label: locale === "en" ? "Both" : "Beide" },
    ]

    const visibleItems: DisplayItem[] = [
        ...(viewMode === "both" || viewMode === "flowTypes" ? flowTypes.map(({ item, icon }) => ({ type: "flowType" as const, item, icon })) : []),
        ...(viewMode === "both" || viewMode === "functionDefinitions" ? functionDefinitions.map(({ item, icon }) => ({ type: "functionDefinition" as const, item, icon })) : []),
    ]
    const emptyLabel = viewMode === "both" ? emptyLabels.both : viewMode === "flowTypes" ? emptyLabels.flowTypes : emptyLabels.functionDefinitions

    return (
        <div className="space-y-6">
            <Switch value={viewMode} options={viewModeOptions} onChange={setViewMode} className="w-max max-w-full overflow-x-auto" fitContent />

            {visibleItems.length > 0 ? (
                <div className="flex flex-col gap-4 md:hidden">
                    {visibleItems.map(({ type, item, icon }) => (
                        <ActionTriggerCard key={item.id} type={type} item={item} icon={icon} />
                    ))}
                </div>
            ) : (
                <p className="px-2 text-sm text-tertiary">{emptyLabel}</p>
            )}
        </div>
    )
}
