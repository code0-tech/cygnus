import { type AppLocale } from "@/lib/i18n"
import { ActionListCard } from "../actions/ActionListCard"
import { NodeCard } from "../cards/NodeCard"
import { RuntimeTypesCard } from "../cards/RuntimeTypesCard"
import { SuggestionMenuCard } from "../cards/SuggestionMenuCard"
import { BentoGrid } from "../ui/BentoGrid"

interface RuntimeFeatureSectionProps {
    locale: AppLocale
}

export function RuntimeBento({ locale }: RuntimeFeatureSectionProps) {
    return (
        <BentoGrid columns={3}>
            <NodeCard locale={locale} animationDelay={0} />
            <SuggestionMenuCard locale={locale} animationDelay={120} />
            <ActionListCard locale={locale} animationDelay={240} />
            <RuntimeTypesCard locale={locale} animationDelay={360} />
        </BentoGrid>
    )
}
