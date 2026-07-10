import { Section } from "@/components/ui/Section"
import type { SwipeCardsLayoutBlock } from "@/lib/cms"
import { SwipeCardsClient } from "./client/SwipeCardsClient"

interface SwipeCardSectionProps {
    content?: SwipeCardsLayoutBlock | null
}

export function SwipeCardSection({ content }: SwipeCardSectionProps) {
    if (!content?.cards?.length) return null

    const cards = content.cards

    return (
        <Section showFunnel={true} animation={{ preset: "zoom-in", delay: 0.2, duration: 0.5 }} heading={content.heading} description={content.subheading} className="w-full items-stretch">
            <SwipeCardsClient cards={cards} />
        </Section>
    )
}
