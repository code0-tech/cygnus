import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { LinkButton } from "@/components/ui/LinkButton"
import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { Section } from "@/components/ui/Section"
import type { StandaloneCardLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Card } from "../ui/Card"

interface StandaloneCardSectionProps {
    content?: StandaloneCardLayoutBlock | null
}

function getImage(image: number | Media | null | undefined) {
    return typeof image === "object" ? image : null
}

function StandaloneCardContent({ content, centered = false }: { content: StandaloneCardLayoutBlock; centered?: boolean }) {
    return (
        <StaggerContainer className={cn("flex flex-col gap-6", centered ? "items-center text-center" : "text-left")} delayChildren={0.04} staggerChildren={0.08}>
            <StaggerItem as="h2" y={14} duration={0.38} className={cn("text-3xl font-semibold text-white md:text-5xl", centered ? "max-w-4xl" : "max-w-xl")}>
                {content.title}
            </StaggerItem>

            {content.description && (
                <StaggerItem as="p" y={14} duration={0.38} className={cn("text-base leading-7 text-secondary md:text-lg", centered ? "max-w-2xl" : "max-w-xl")}>
                    {content.description}
                </StaggerItem>
            )}

            <StaggerItem as="ul" y={14} duration={0.38} className={cn("grid gap-2 text-sm text-secondary md:text-base", centered ? "" : "")}>
                {content.bulletPoints?.map((point, pointIndex) => (
                    <li key={`${content.id ?? content.title}-point-${pointIndex}`} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{point}</span>
                    </li>
                ))}
            </StaggerItem>

            {content.link?.label && content.link?.url && (
                <StaggerItem y={14} duration={0.38}>
                    <LinkButton href={content.link.url}>{content.link.label}</LinkButton>
                </StaggerItem>
            )}
        </StaggerContainer>
    )
}

export function StandaloneCardSection({ content }: StandaloneCardSectionProps) {
    if (!content || !content.title) return null

    const image = getImage(content.image)
    const imageUrl = getMediaUrl(image?.url)
    const isPlayground = content.mediaType === "playground"
    const media = isPlayground ? (
        <PlaygroundFrame url={content.playgroundUrl} title={`${content.title} playground`} />
    ) : (
        imageUrl && <Image src={imageUrl} alt={image?.alt ?? content.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-center" />
    )
    const isImageLeft = content.sectionLayout === "imageLeft"
    const isFullscreen = content.sectionLayout === "imageFullscreen"
    const isSideFullscreen = content.sectionLayout === "imageRightFullscreen" || content.sectionLayout === "imageLeftFullscreen"
    const isSideFullscreenLeft = content.sectionLayout === "imageLeftFullscreen"
    const isSideFullscreenRight = content.sectionLayout === "imageRightFullscreen"

    const showImageBorder = content.showImageBorder ?? true

    return (
        <Section showFunnel={false} animation={{ preset: "none" }}>
            <Card
                size="lg"
                gradientDirection={content.gradientDirection}
                radialGradient={content.gradient}
                className={cn(
                    "relative h-[min(85svh,918px)] w-full shrink-0 overflow-x-hidden overflow-y-auto bg-primary md:h-[min(85dvh,918px)] md:overflow-hidden",
                    isFullscreen ? "p-0" : isSideFullscreen ? "grid p-0 md:grid-cols-2" : "grid gap-6 p-6 sm:gap-8 sm:p-8 md:gap-12 md:p-12 md:grid-cols-[0.95fr_1.05fr]"
                )}
            >
                {isFullscreen ? (
                    <div className={cn("relative z-10 h-full w-full overflow-hidden rounded-3xl", showImageBorder && "border border-white/10")}>
                        {isPlayground ? media : imageUrl && <Image src={imageUrl} alt={image?.alt ?? content.title} fill sizes="100vw" className="object-cover object-center" />}

                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <div className="mx-auto max-w-4xl px-6">
                                <StandaloneCardContent content={content} centered />
                            </div>
                        </div>
                    </div>
                ) : isSideFullscreen ? (
                    <>
                        <div className={cn("relative z-10 flex flex-col justify-center gap-6 p-6 sm:p-8 md:h-full md:gap-8 md:p-12", isSideFullscreenLeft && "md:order-2")}>
                            <StandaloneCardContent content={content} />
                        </div>

                        <div
                            className={cn(
                                "relative z-10 min-h-64 w-full overflow-hidden mt-px md:h-full",
                                showImageBorder && "border-white/5",
                                isSideFullscreenLeft && "md:order-1 border-r",
                                isSideFullscreenRight && "border-l"
                            )}
                        >
                            {isPlayground ? media : imageUrl && <Image src={imageUrl} alt={image?.alt ?? content.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-center" />}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={cn("relative z-10 flex h-full flex-col justify-center gap-8 rounded-3xl", isImageLeft && "md:order-2")}>
                            <StandaloneCardContent content={content} />
                        </div>

                        <div className={cn("relative z-10 aspect-video w-full self-center overflow-hidden rounded-2xl", showImageBorder && "border border-white/10", isImageLeft && "md:order-1")}>
                            {media}
                        </div>
                    </>
                )}
            </Card>
        </Section>
    )
}
