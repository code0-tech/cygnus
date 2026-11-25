import { ActionDefinitionAccordion } from "@/components/actions/ActionDefinitionAccordion"
import { Section } from "@/components/ui/Section"
import { extractFlowTypesFromJson } from "@/lib/actionExtraction"

interface ActionEventsSectionProps {
    moduleJson: unknown
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    flowTypeLabel?: string | null
    settingsLabel?: string | null
    showAllLabel?: string | null
    showLessLabel?: string | null
}

export function ActionEventsSection({ moduleJson, sectionHeading, sectionLayout, sectionDescription, sectionLinkButton, settingsLabel, showAllLabel, showLessLabel }: ActionEventsSectionProps) {
    const events = extractFlowTypesFromJson(moduleJson)
    if (!events.length) return null

    return (
        <Section heading={sectionHeading} description={sectionDescription} funnelType={sectionLayout ?? "left"} linkButton={sectionLinkButton} className="w-full" headingLevel={2}>
            <ActionDefinitionAccordion items={events} name="action-events" entriesLabel={settingsLabel || "Settings"} showAllLabel={showAllLabel || "Show all"} showLessLabel={showLessLabel || "Show less"} />
        </Section>
    )
}
