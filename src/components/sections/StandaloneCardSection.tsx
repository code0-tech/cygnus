"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Card } from "../ui/Card"

interface StandaloneCardSectionProps {
    content?: any | null
}

function getImage(image: number | Media | null | undefined) {
    return typeof image === "object" ? image : null
}

export function StandaloneCardSection({ content }: StandaloneCardSectionProps) {
    if (!content || !content.title) return null

    const image = getImage(content.image)
    const imageUrl = getMediaUrl(image?.url)
    const itemSettings = content as {
        sectionLayout?: "imageRight" | "imageLeft" | "imageFullscreen" | null
        showImageBorder?: boolean | null
        gradient?: string | null
        gradientDirection?: string | null
    }
    const isImageLeft = itemSettings.sectionLayout === "imageLeft"
    const isFullscreen = itemSettings.sectionLayout === "imageFullscreen"
    const showImageBorder = itemSettings.showImageBorder ?? true

    return (
        <Section showFunnel={false} animation={{ preset: "none" }} className="h-[calc(100vh-6rem)]">
            <Card
                size="lg"
                gradientDirection={itemSettings.gradientDirection as any}
                radialGradient={itemSettings.gradient as any}
                className={cn(isFullscreen ? "relative h-[80%] overflow-hidden bg-primary p-0" : "relative grid h-[80%] overflow-hidden bg-primary p-12 md:grid-cols-[0.95fr_1.05fr]")}
            >
                {isFullscreen ? (
                    <div className={cn("relative z-10 h-full w-full overflow-hidden rounded-3xl", showImageBorder && "border border-white/10")}>
                        {imageUrl && <Image src={imageUrl} alt={image?.alt ?? content.title} fill sizes="100vw" className="object-cover object-center" />}
                    </div>
                ) : (
                    <>
                        <div className={cn("relative z-10 flex h-full flex-col justify-center gap-8 rounded-3xl", isImageLeft && "md:order-2")}>
                            <div className="flex flex-col gap-4">
                                <h2 className="max-w-xl text-3xl font-semibold text-white md:text-5xl">{content.title}</h2>
                                <p className="max-w-xl text-base leading-7 text-white/75 md:text-lg">{content.description}</p>
                            </div>

                            <div className="space-y-6">
                                <ul className="grid gap-2 text-sm text-white/75 md:text-base">
                                    {content.bulletPoints?.map((point: any, pointIndex: number) => (
                                        <li key={`point-${pointIndex}`} className="flex items-start gap-3">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>

                                {content.link?.label && content.link?.url && <LinkButton href={content.link.url}>{content.link.label}</LinkButton>}
                            </div>
                        </div>

                        <div className={cn("relative z-10 aspect-video w-full self-center overflow-hidden rounded-2xl", showImageBorder && "border border-white/10", isImageLeft && "md:order-1")}>
                            {imageUrl && <Image src={imageUrl} alt={image?.alt ?? content.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-center" />}
                        </div>
                    </>
                )}
            </Card>
        </Section>
    )
}
