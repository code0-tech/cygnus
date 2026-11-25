import { ActionDefinitionAccordion } from "@/components/actions/ActionDefinitionAccordion"
import { Section } from "@/components/ui/Section"
import { extractFunctionDefinitionsFromJson } from "@/lib/actionExtraction"

interface ActionFunctionsSectionProps {
    moduleJson: unknown
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    functionDefinitionLabel?: string | null
    parametersLabel?: string | null
    showAllLabel?: string | null
    showLessLabel?: string | null
}

export function ActionFunctionsSection({ moduleJson, sectionHeading, sectionLayout, sectionDescription, sectionLinkButton, parametersLabel, showAllLabel, showLessLabel }: ActionFunctionsSectionProps) {
    const functionDefinitions = extractFunctionDefinitionsFromJson(moduleJson)
    if (!functionDefinitions.length) return null

    return (
        <Section heading={sectionHeading} description={sectionDescription} funnelType={sectionLayout ?? "left"} linkButton={sectionLinkButton} className="w-full" headingLevel={2}>
            <ActionDefinitionAccordion items={functionDefinitions} name="action-functions" entriesLabel={parametersLabel || "Parameters"} showAllLabel={showAllLabel || "Show all"} showLessLabel={showLessLabel || "Show less"} />
        </Section>
    )
}
