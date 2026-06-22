"use client"

import { useEffect, useState } from "react"
import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"
import type { Media } from "@/payload-types"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import { extractFunctionDefsFromJson, extractTriggersFromJson, fetchMediaJson, type ExtractedActionTriggerItem, type ExtractedFunctionDef, type ExtractedTrigger } from "@/lib/actionTriggerExtraction"

interface ActionTriggerViewProps {
    locale: string
    triggers: Media | undefined
    functionDefs: Media | undefined
}

const itemClassName = "text-white/70! transition-colors! data-[state=on]:bg-brand/20! data-[state=on]:text-brand!"

interface DisplayItem {
    type: "trigger" | "functionDef"
    item: ExtractedActionTriggerItem
}

export function ActionTriggerView({ locale, triggers, functionDefs }: ActionTriggerViewProps) {
    const [viewMode, setViewMode] = useState<"both" | "triggers" | "functionDefs">("both")
    const [extractedTriggers, setExtractedTriggers] = useState<ExtractedTrigger[]>([])
    const [extractedFunctionDefs, setExtractedFunctionDefs] = useState<ExtractedFunctionDef[]>([])

    useEffect(() => {
        let cancelled = false

        async function loadMediaJson() {
            const [triggerJson, functionDefJson] = await Promise.all([fetchMediaJson(triggers), fetchMediaJson(functionDefs)])

            if (cancelled) {
                return
            }

            setExtractedTriggers(extractTriggersFromJson(triggerJson))
            setExtractedFunctionDefs(extractFunctionDefsFromJson(functionDefJson))
        }

        loadMediaJson().catch(() => {
            if (!cancelled) {
                setExtractedTriggers([])
                setExtractedFunctionDefs([])
            }
        })

        return () => {
            cancelled = true
        }
    }, [triggers, functionDefs])

    const visibleItems: DisplayItem[] = [
        ...(viewMode === "both" || viewMode === "triggers" ? extractedTriggers.map((trigger) => ({ type: "trigger" as const, item: trigger })) : []),
        ...(viewMode === "both" || viewMode === "functionDefs" ? extractedFunctionDefs.map((functionDef) => ({ type: "functionDef" as const, item: functionDef })) : []),
    ]

    return (
        <div className="space-y-6">
            <SegmentedControl
                type="single"
                value={viewMode}
                onValueChange={(value) => {
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
                {visibleItems.map(({ type, item }) => (
                    <ActionTriggerCard key={item.id} type={type} item={item} />
                ))}
            </div>
        </div>
    )
}
