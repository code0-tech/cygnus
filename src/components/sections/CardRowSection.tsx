import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { CardRowLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Children, type ReactNode } from "react"
import { Card } from "../ui/Card"

interface CardRowSectionProps {
    content?: CardRowLayoutBlock | null
    children?: ReactNode
}

function getImageUrl(image: number | Media | null | undefined) {
    return typeof image === "object" ? getMediaUrl(image?.url) : ""
}

export function CardRowSection({ content, children }: CardRowSectionProps) {
    const cards = content?.cards?.filter((card) => Boolean(card.title)) ?? []
    const fallbackImages = Children.toArray(children)
    if (cards.length === 0) return null

    return (
        <Section
            heading={content?.sectionHeading}
            description={content?.sectionDescription}
            linkButton={content?.sectionLinkButton}
            funnelType={content?.sectionLayout ?? "left"}
            animation={{ preset: "none" }}
        >
            <StaggerContainer className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 z-10" delayChildren={0.04} staggerChildren={0.08}>
                {cards.map((card, index) => {
                    const mediaImage = typeof card.image === "object" ? card.image : null
                    const imageUrl = getImageUrl(card.image)
                    const fallbackImage = fallbackImages[index]

                    return (
                        <StaggerItem key={card.id ?? `${card.title}-${index}`} y={14} duration={0.48} className="h-full">
                            <Card
                                size={"lg"}
                                className="group flex h-full p-2! transform-gpu flex-col will-change-transform before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.5rem-1px)] before:border before:border-white/5 before:content-['']"
                            >
                                {imageUrl ? (
                                    <div className="relative aspect-[243.476/160] overflow-hidden rounded-2xl bg-primary/40">
                                        <Image src={imageUrl} alt={mediaImage?.alt ?? card.title ?? ""} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                                    </div>
                                ) : (
                                    fallbackImage
                                )}

                                <div className="relative z-10 flex h-full flex-1 flex-col px-2 pb-2 pt-4">
                                    <h3 className="text-xl font-semibold text-white tracking-normal">{card.title}</h3>
                                    {card.description && <p className="mt-1 text-secondary">{card.description}</p>}
                                    {card.link?.url && (
                                        <LinkButton href={card.link.url} className="mt-auto pt-4">
                                            {card.link.label}
                                        </LinkButton>
                                    )}
                                </div>
                            </Card>
                        </StaggerItem>
                    )
                })}
            </StaggerContainer>
        </Section>
    )
}
