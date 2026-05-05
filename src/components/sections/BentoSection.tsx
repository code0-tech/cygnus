import { FeatureBento } from "@/components/bentos/FeatureBento"
import { RuntimeBento } from "@/components/bentos/RuntimeBento"
import { Section } from "@/components/ui/Section"
import { BentoLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"

interface BentoSectionProps {
    content?: BentoLayoutBlock | null
    locale?: AppLocale
}

export function BentoSection({ content, locale = "en" }: BentoSectionProps) {
    const variant = content?.variant ?? "feature"

    return (
        <Section
            heading={content?.sectionHeading}
            description={content?.sectionDescription}
            linkButton={content?.sectionLinkButton}
            fullHeight
        >
            {variant === "runtime" ? (
                <RuntimeBento locale={locale} />
            ) : (
                <FeatureBento locale={locale} />
            )}
        </Section>
    )
}
