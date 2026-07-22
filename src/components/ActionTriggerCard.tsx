"use client"

import type { ExtractedFlowType, ExtractedFunctionDefinition } from "@/lib/actionExtraction"
import { IconChevronDown } from "@tabler/icons-react"
import { useCallback, useMemo, useState } from "react"
import { Card } from "./ui/Card"

interface ActionTriggerCardProps {
    type: "flowType" | "functionDefinition"
    item: ExtractedFlowType | ExtractedFunctionDefinition
}

export function ActionTriggerCard({ type, item }: ActionTriggerCardProps) {
    const [openItem, setOpenItem] = useState<number | null>(null)
    const open = openItem === 0
    const parameters = item.kind === "functionDefinition" ? item.parameters : item.kind === "flowType" ? item.settings : []
    const label = type === "flowType" ? "FlowType" : "FunctionDefinition"
    const parameterLabel = type === "flowType" ? "Settings" : "Parameters"
    const toggleItem = useCallback((index: number) => {
        setOpenItem((previousItem) => (previousItem === index ? null : index))
    }, [])
    const parameterList = useMemo(
        () => (
            <div className="flex flex-col gap-3">
                <div className="grid gap-1 text-xs">
                    <div className="text-tertiary">{label}</div>
                    <div className="font-medium text-white">{item.identifier}</div>
                </div>

                {parameters.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-xs text-tertiary">{parameterLabel}</div>
                        {parameters.map((parameter) => (
                            <div key={parameter.id} className="rounded-md bg-primary/50 p-2">
                                <div className="text-xs font-medium text-white">{parameter.name || parameter.identifier}</div>
                                {parameter.description && <div className="mt-1 text-xs leading-5 text-tertiary">{parameter.description}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ),
        [item.identifier, label, parameterLabel, parameters]
    )

    return (
        <Card size="sm" className="bg-light p-0!">
            <div className="relative z-10">
                <button type="button" onClick={() => toggleItem(0)} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                    <span className="min-w-0 truncate text-sm font-medium text-white">{item.name || item.identifier}</span>
                    <IconChevronDown size={16} className={`shrink-0 text-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && <div className="border-t border-white/5 px-3 pb-3 pt-2">{parameterList}</div>}
            </div>
        </Card>
    )
}
