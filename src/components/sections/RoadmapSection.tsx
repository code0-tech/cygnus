import { Section } from "@/components/ui/Section"
import { RoadmapLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { Card } from "../ui/Card"
import { StableBadge } from "../ui/StableBadge"

interface RoadmapSectionProps {
    content?: RoadmapLayoutBlock | null
}

export function RoadmapSection({ content }: RoadmapSectionProps) {
    const items = content?.items ?? []
    if (!items?.length) return null

    return (
        <Section
            heading={content?.sectionHeading}
            description={content?.sectionDescription}
            linkButton={content?.sectionLinkButton}
            funnelType={content?.sectionLayout ?? "center"}
            animation={{ preset: "zoom-in" }}
        >
            <div className="relative w-full py-8 md:py-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-0 h-full w-0.5 rounded-full bg-linear-to-b from-brand/10 via-white/20 to-blue/10 md:left-1/2 md:-translate-x-1/2"
                />
                <div className="flex flex-col gap-10 md:gap-14">
                    {items.map((item, index) => (
                        <div key={item.id ?? `roadmap-item-${index}`} className="relative">
                            <div aria-hidden="true" className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/70 bg-brand md:left-1/2" />
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 md:gap-12", index % 2 === 0 && "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1")}>
                                <div aria-hidden="true" className="hidden md:block" />
                                <Card
                                    size="lg"
                                    variant="light"
                                    className={cn("relative ml-8 md:ml-0 z-10 cursor-default isolate p-4 md:w-[90%]", index % 2 === 0 ? "md:mr-0 md:ml-auto" : "md:ml-0 md:mr-auto")}
                                >
                                    <StableBadge color="info" className="text-sm px-3 py-1">
                                        {item.time}
                                    </StableBadge>
                                    <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">{item.title}</h3>
                                    <p className="my-2 text-sm text-white/75">{item.description}</p>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    )
}
