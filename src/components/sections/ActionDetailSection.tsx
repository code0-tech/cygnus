import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import { Section } from "@/components/ui/Section"
import { extractFlowTypesFromJson, extractFunctionDefinitionsFromJson } from "@/lib/actionExtraction"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ActionDetailSectionProps {
    moduleJson: unknown
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    flowTypesLabel: string
    functionDefinitionsLabel: string
}

export function ActionDetailSection({ moduleJson, sectionHeading, sectionLayout, sectionDescription, sectionLinkButton, flowTypesLabel, functionDefinitionsLabel }: ActionDetailSectionProps) {
    const flowTypes = extractFlowTypesFromJson(moduleJson)
    const functionDefinitions = extractFunctionDefinitionsFromJson(moduleJson)
    if (!flowTypes.length && !functionDefinitions.length) return null

    return (
        <Section heading={sectionHeading} description={sectionDescription} funnelType={sectionLayout ?? "left"} linkButton={sectionLinkButton} className="w-full" headingLevel={2}>
            <div className="space-y-8">
                {flowTypes.length > 0 && (
                    <ActionDefinitionGroup label={flowTypesLabel}>
                        {flowTypes.map((item) => (
                            <ActionTriggerCard key={item.id} type="flowType" item={item} />
                        ))}
                    </ActionDefinitionGroup>
                )}
                {functionDefinitions.length > 0 && (
                    <ActionDefinitionGroup label={functionDefinitionsLabel}>
                        {functionDefinitions.map((item) => (
                            <ActionTriggerCard key={item.id} type="functionDefinition" item={item} />
                        ))}
                    </ActionDefinitionGroup>
                )}
            </div>
        </Section>
    )
}

function ActionDefinitionGroup({ label, children }: { label: string; children: ReactNode }) {
    const items = Array.isArray(children) ? children : [children]
    const columnCount = Math.min(items.length, 3)
    const columns = Array.from({ length: columnCount }, (_, columnIndex) => items.filter((_, itemIndex) => itemIndex % columnCount === columnIndex))

    return (
        <div className="space-y-4">
            <p className="text-sm text-tertiary">{label}</p>
            <div className={cn("grid grid-cols-1 items-start gap-3", columnCount === 2 ? "md:grid-cols-2" : columnCount === 3 ? "md:grid-cols-3" : "md:grid-cols-1")}>
                {columns.map((column, columnIndex) => (
                    <div key={`${label}-${columnIndex}`} className="flex min-w-0 flex-col gap-3">
                        {column}
                    </div>
                ))}
            </div>
        </div>
    )
}
