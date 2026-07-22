"use client"

import type { ExtractedFlowType, ExtractedFunctionDefinition } from "@/lib/actionExtraction"
import { cn } from "@/lib/utils"
import { IconChevronDown } from "@tabler/icons-react"
import { useCallback, useMemo, useState } from "react"

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
            <div className="flex flex-col gap-2">
                <div className="grid gap-1 text-sm">
                    <div className="text-tertiary">{label}</div>
                    <div className="font-medium text-white">{item.identifier}</div>
                </div>

                {parameters.length > 0 && (
                    <div className="-mx-2 flex flex-col gap-1 border-t border-white/5 px-2 pt-2">
                        <div className="text-sm text-tertiary">{parameterLabel}</div>
                        {parameters.map((parameter) => (
                            <div key={parameter.id} className="text-sm leading-5">
                                <span className="font-medium text-white">
                                    {parameter.name || parameter.identifier}
                                    {parameter.description ? ":" : ""}
                                </span>{" "}
                                {parameter.description && <span className="text-secondary">{parameter.description}</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ),
        [item.identifier, label, parameterLabel, parameters]
    )

    return (
        <div className={cn("overflow-hidden rounded-xl border duration-300 ease-out", open ? "border-white/10 bg-light" : "border-white/5 bg-light/40 hover:bg-light/70")}>
            <div className="relative z-10">
                <button type="button" onClick={() => toggleItem(0)} className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left">
                    <span className="min-w-0 truncate font-medium text-white">{item.name || item.identifier}</span>
                    <IconChevronDown size={16} className={cn("shrink-0 text-tertiary transition-transform duration-300 ease-out", open && "rotate-180")} />
                </button>

                <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="min-h-0 overflow-hidden">
                        <div className="border-t border-white/5 px-2 pb-2 pt-2">{parameterList}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
