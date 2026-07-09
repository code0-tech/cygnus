import { Section } from "@/components/ui/Section"
import type { ListFeatureLayoutBlock } from "@/lib/cms"
import { getIcon } from "@/components/IconRenderer"

interface ListFeatureSectionProps {
    content?: ListFeatureLayoutBlock | null
}

export function ListFeatureSection({ content }: ListFeatureSectionProps) {
    const features = content?.features?.filter((feature) => Boolean(feature.title)) ?? []

    if (!content || features.length === 0) return null

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <div className="grid gap-8 md:gap-12 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                    <div key={feature.id ?? `${feature.title}-${index}`} className="flex flex-col gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white">{getIcon(feature.icon, 24)}</div>

                        <div className="flex flex-col">
                            <h3 className="text-lg font-semibold tracking-wide text-white">{feature.title}</h3>
                            {feature.description && <p className="text-secondary">{feature.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    )
}
