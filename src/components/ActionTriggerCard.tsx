"use client"

import { BaseAccordionItem } from "@/components/ui/Accordion"
import type { ExtractedActionTriggerItem } from "@/lib/actionTriggerExtraction"
import { getTablerIcon } from "@/lib/tablerIcons"
import { useState } from "react"
import { Card } from "./ui/Card"

interface ActionTriggerCardProps {
    type: "trigger" | "functionDef"
    item: ExtractedActionTriggerItem
}

export function ActionTriggerCard({ type, item }: ActionTriggerCardProps) {
    const [openItem, setOpenItem] = useState<number | null>(null)
    const parameters = item.kind === "functionDef" ? item.parameters : item.settings
    const label = type === "trigger" ? "Trigger" : "FunctionDefinition"
    const parameterLabel = type === "trigger" ? "Settings" : "Parameters"
    const icon = getTablerIcon(item.kind === "trigger" ? item.displayIcon : "function", 32)

    const toggleItem = (index: number) => {
        setOpenItem((previousItem) => (previousItem === index ? null : index))
    }

    return (
        <Card size="sm" className="bg-primary">
            <div className="relative z-10 flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-brand">{icon}</div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium tracking-wider text-tertiary">{label}</p>
                            <h3 className="mt-1 truncate text-base tracking-wide font-semibold text-white">{item.name || item.identifier}</h3>
                        </div>
                    </div>
                    <div className="shrink-0 rounded-lg border border-white/5 bg-white/5 px-2 py-1 text-xs text-tertiary">{item.identifier}</div>
                </div>

                {item.description && <p className="line-clamp-3 text-sm leading-6 text-secondary">{item.description}</p>}

                {parameters.length > 0 && (
                    <div className="mt-auto pt-2">
                        <BaseAccordionItem
                            index={0}
                            question={`${parameterLabel} (${parameters.length})`}
                            isOpen={openItem === 0}
                            onToggle={toggleItem}
                            className="rounded-lg before:bg-none"
                            questionClassname="pl-5 pr-2 py-1 text-sm lg:text-sm"
                            answer={
                                <div className="flex flex-col gap-2">
                                    {parameters.map((parameter) => (
                                        <div key={parameter.id} className="rounded-md bg-white/2 p-2">
                                            <div className="text-xs font-medium text-secondary">{parameter.name || parameter.identifier}</div>
                                            {parameter.description && <div className="mt-1 text-xs leading-5 text-tertiary">{parameter.description}</div>}
                                        </div>
                                    ))}
                                </div>
                            }
                        />
                    </div>
                )}
            </div>
        </Card>
    )
}
