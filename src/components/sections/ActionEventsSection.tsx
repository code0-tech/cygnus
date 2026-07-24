import { ActionTriggerCard } from "@/components/ActionTriggerCard"
import { Section } from "@/components/ui/Section"
import { extractFlowTypesFromJson } from "@/lib/actionExtraction"
import { cn } from "@/lib/utils"

interface ActionEventsSectionProps {
    moduleJson: unknown
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
}

export function ActionEventsSection({ moduleJson, sectionHeading, sectionLayout, sectionDescription, sectionLinkButton }: ActionEventsSectionProps) {
    const events = extractFlowTypesFromJson(moduleJson)
    if (!events.length) return null
    const columnCount = Math.min(events.length, 3)
    const columns = Array.from({ length: columnCount }, (_, columnIndex) => events.filter((_, itemIndex) => itemIndex % columnCount === columnIndex))

    return (
        <Section heading={sectionHeading} description={sectionDescription} funnelType={sectionLayout ?? "left"} linkButton={sectionLinkButton} className="w-full" headingLevel={2}>
            <div className={cn("grid grid-cols-1 items-start gap-3", columnCount === 2 ? "md:grid-cols-2" : columnCount === 3 ? "md:grid-cols-3" : "md:grid-cols-1")}>
                {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="flex min-w-0 flex-col gap-3">
                        {column.map((item) => (
                            <ActionTriggerCard key={item.id} type="flowType" item={item} />
                        ))}
                    </div>
                ))}
            </div>
        </Section>
    )
}
