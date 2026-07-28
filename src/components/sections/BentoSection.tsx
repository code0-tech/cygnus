import { FeatureBento } from "@/components/bentos/FeatureBento"
import { RuntimeBento } from "@/components/bentos/RuntimeBento"
import { Section } from "@/components/ui/Section"
import type { BentoLayoutBlock } from "@/lib/cms"

interface BentoSectionProps {
    content?: BentoLayoutBlock | null
}

export function BentoSection({ content }: BentoSectionProps) {
    const variant = content?.variant ?? "feature"

    return (
        <Section heading={content?.sectionHeading} description={content?.sectionDescription} linkButton={content?.sectionLinkButton} funnelType={content?.sectionLayout ?? "center"} fullHeight>
            {variant === "runtime" ? <RuntimeBento content={content?.runtimeContent} /> : <FeatureBento content={content?.featureContent} />}
        </Section>
    )
}
