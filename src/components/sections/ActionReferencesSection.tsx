import { ActionCard } from "@/components/cards/ActionCard"
import type { ActionItem } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Section } from "@/components/ui/Section"

interface ActionReferencesSectionProps {
    references: ActionItem[]
    locale: AppLocale
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
}

export function ActionReferencesSection({ references, locale, sectionHeading, sectionLayout, sectionDescription, sectionLinkButton }: ActionReferencesSectionProps) {
    if (!references.length) return null
    return (
        <Section heading={sectionHeading} description={sectionDescription} funnelType={sectionLayout ?? "left"} linkButton={sectionLinkButton} className="w-full">
            <div className="grid gap-4 md:grid-cols-2">
                {references.map((reference) => (
                    <ActionCard key={reference.id} action={reference} locale={locale} />
                ))}
            </div>
        </Section>
    )
}
