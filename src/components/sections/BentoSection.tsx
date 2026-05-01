import { FeatureBento } from "@/components/bentos/FeatureBento"
import { RuntimeBento } from "@/components/bentos/RuntimeBento"
import { Section } from "@/components/ui/Section"
import type { AppLocale } from "@/lib/i18n"

interface BentoSectionContent {
    variant?: "feature" | "runtime" | null
}

interface BentoSectionProps {
    content?: BentoSectionContent | null
    locale?: AppLocale
}

export function BentoSection({ content, locale = "en" }: BentoSectionProps) {
    const variant = content?.variant ?? "feature"

    return (
        <Section
            sectionType={variant === "runtime" ? "RuntimeFeatureSection" : "AppFeatureSection"}
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
