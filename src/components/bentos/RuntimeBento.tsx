import type { BentoLayoutBlock } from "@/lib/cms"
import { ActionListCard } from "../actions/ActionListCard"
import { NodeCard } from "../cards/NodeCard"
import { RuntimeTypesCard } from "../cards/RuntimeTypesCard"
import { SuggestionMenuCard } from "../cards/SuggestionMenuCard"
import { BentoGrid } from "../ui/BentoGrid"

interface RuntimeFeatureSectionProps {
    content?: BentoLayoutBlock["runtimeContent"]
}

export function RuntimeBento({ content }: RuntimeFeatureSectionProps) {
    return (
        <BentoGrid columns={3}>
            <NodeCard content={content?.nodes} animationDelay={0} />
            <SuggestionMenuCard content={content?.suggestionMenu} animationDelay={120} />
            <ActionListCard content={content?.actionList} animationDelay={240} />
            <RuntimeTypesCard content={content?.runtimeTypes} animationDelay={360} />
        </BentoGrid>
    )
}
