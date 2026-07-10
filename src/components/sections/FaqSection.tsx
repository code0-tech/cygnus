import { Section } from "@/components/ui/Section"
import type { FaqLayoutBlock } from "@/lib/cms"
import { FaqList } from "./client/FaqList"

interface FaqSectionProps {
    content?: FaqLayoutBlock | null
}

export function FaqSection({ content }: FaqSectionProps) {
    if (!content || !content.items) return
    const items = content.items.filter((item): item is typeof item & { question: string; answer: string } => Boolean(item.question && item.answer))

    return (
        <Section heading={content.sectionHeading} description={content.sectionDescription} linkButton={content.sectionLinkButton} funnelType={content.sectionLayout ?? "center"} showLinkButton={false}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" />
            <FaqList items={items} />
        </Section>
    )
}
