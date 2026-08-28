import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { LinkButton } from "@/components/ui/LinkButton"
import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { Section } from "@/components/ui/Section"
import type { OffsetCardsLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn, type AnimationPreset } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Card } from "../ui/Card"
import { OffsetCardMotion } from "./client/OffsetCardMotion"

interface OffsetCardsSectionProps {
    content?: OffsetCardsLayoutBlock | null
}

const OFFSET_CARD_ANIMATION_SEQUENCE: Exclude<AnimationPreset, "none">[] = ["slide-left", "slide-right", "slide-left"]
const IMAGE_MASK_CLASSES = {
    top: "inset-x-0 top-0 h-1/3 bg-linear-to-b from-primary to-transparent",
    right: "inset-y-0 right-0 w-1/3 bg-linear-to-l from-primary to-transparent",
    bottom: "inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-primary to-transparent",
    left: "inset-y-0 left-0 w-1/3 bg-linear-to-r from-primary to-transparent",
} as const

export function OffsetCardsSection({ content }: OffsetCardsSectionProps) {
    if (!content?.cards?.length) return null

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <div className="relative flex w-full flex-col items-stretch gap-12">
                {content.cards.map((item, index) => {
                    const animationPreset = OFFSET_CARD_ANIMATION_SEQUENCE[index % OFFSET_CARD_ANIMATION_SEQUENCE.length]
                    const image = item.image as Media
                    const imageUrl = getMediaUrl(image?.url)
                    const isPlayground = item.mediaType === "playground"
                    const cardPlacement = content.cardPlacement ?? "alternate"
                    const isCardLeft = cardPlacement === "left" || (cardPlacement === "alternate" && index % 2 !== 0)

                    return (
                        <OffsetCardMotion
                            key={item.id ?? item.label}
                            className={cn("flex w-full flex-col items-center gap-8", isCardLeft ? "lg:flex-row-reverse" : "lg:flex-row")}
                            index={index}
                            preset={animationPreset}
                        >
                            <StaggerContainer className="mt-4 hidden w-1/2 px-2 pb-2 text-center lg:block lg:text-left" delayChildren={0.06} staggerChildren={0.08}>
                                <StaggerItem as="p" y={14} duration={0.38} className="text-xl font-semibold text-white lg:text-3xl">
                                    {item.title}
                                </StaggerItem>
                                <StaggerItem as="p" y={14} duration={0.38} className="mt-3 max-w-xl text-sm leading-7 text-secondary lg:text-base">
                                    {item.description}
                                </StaggerItem>
                                <StaggerItem as="ul" y={14} duration={0.38} className="mt-5 space-y-2.5 text-sm text-secondary lg:text-base">
                                    {item.bulletPoints?.map((point, pointIndex) => (
                                        <li key={`${item.id ?? item.label}-point-${pointIndex}`} className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </StaggerItem>
                                {item.link?.label && item.link?.url && (
                                    <StaggerItem y={14} duration={0.38} className="mt-5">
                                        <LinkButton href={item.link.url}>{item.link.label}</LinkButton>
                                    </StaggerItem>
                                )}
                            </StaggerContainer>
                            <Card
                                size="lg"
                                topline={item.showImageBorder ?? true}
                                className={cn("relative aspect-video w-full overflow-hidden lg:w-2/3", item.showImageBorder === false && "border-0")}
                            >
                                {isPlayground ? (
                                    <PlaygroundFrame url={item.playgroundUrl} title={`${item.title} playground`} />
                                ) : (
                                    <>
                                        {imageUrl && <Image src={imageUrl} alt={image.alt ?? item.title} fill sizes="(min-width: 768px) 66vw, 100vw" className="object-fill" />}
                                        {item.mask?.map((side) => (
                                            <div key={side} aria-hidden="true" className={cn("pointer-events-none absolute z-10", IMAGE_MASK_CLASSES[side])} />
                                        ))}
                                    </>
                                )}
                            </Card>
                            <StaggerContainer className="w-full px-2 pb-2 text-left lg:hidden lg:text-center" delayChildren={0.06} staggerChildren={0.08}>
                                <StaggerItem as="p" y={14} duration={0.38} className="text-xl font-semibold tracking-tight text-white">
                                    {item.title}
                                </StaggerItem>
                                <StaggerItem as="p" y={14} duration={0.38} className="mt-3 text-sm leading-7 text-secondary">
                                    {item.description}
                                </StaggerItem>
                                <StaggerItem as="ul" y={14} duration={0.38} className="mt-5 space-y-2.5 text-left text-sm text-secondary">
                                    {item.bulletPoints?.map((point, pointIndex) => (
                                        <li key={`${item.id ?? item.label}-mobile-point-${pointIndex}`} className="flex items-start gap-3">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </StaggerItem>
                                {item.link?.label && item.link?.url && (
                                    <StaggerItem y={14} duration={0.38} className="mt-5">
                                        <LinkButton href={item.link.url}>{item.link.label}</LinkButton>
                                    </StaggerItem>
                                )}
                            </StaggerContainer>
                        </OffsetCardMotion>
                    )
                })}
            </div>
        </Section>
    )
}
