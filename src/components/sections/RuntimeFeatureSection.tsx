import { Section } from "@/components/ui/Section"
import { type AppLocale } from "@/lib/i18n"
import React from "react"
import { ActionListCard } from "../cards/ActionListCard"
import { NodeTabsCard } from "../cards/NodeTabsCard"
import { RuntimeTypesCard } from "../cards/RuntimeTypesCard"
import { SuggestionMenuCard } from "../cards/SuggestionMenuCard"
import { BentoGrid } from "../ui/BentoGrid"

interface RuntimeFeatureSectionProps {
    locale: AppLocale
}

export const RuntimeFeatureSection: React.FC<RuntimeFeatureSectionProps> = ({ locale }) => {
    return (
        <Section sectionType="RuntimeFeatureSection" fullHeight>
            <BentoGrid columns={3}>
                <NodeTabsCard locale={locale} />
                <SuggestionMenuCard locale={locale} />
                <ActionListCard locale={locale} />
                <RuntimeTypesCard locale={locale} />
            </BentoGrid>
        </Section>
    )
}
