import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { ScrollCardsLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Card } from "../ui/Card"
import { ScrollCardPinning } from "./client/ScrollCardPinning"

interface ScrollCardSectionProps {
    content?: ScrollCardsLayoutBlock | null
}

function getImage(image: number | Media | null | undefined) {
    return typeof image === "object" ? image : null
}

export function ScrollCardSection({ content }: ScrollCardSectionProps) {
    const items = content?.items?.filter((item) => Boolean(item.title)) ?? []
    if (items.length === 0) return null

    return (
        <Section showFunnel={false} animation={{ preset: "none" }}>
            <ScrollCardPinning itemCount={items.length}>
                {items.map((item, index) => {
                    const image = getImage(item.image)
                    const imageUrl = getMediaUrl(image?.url)
                    const itemSettings = item as {
                        sectionLayout?: "imageRight" | "imageLeft" | "imageFullscreen" | "imageRightFullscreen" | "imageLeftFullscreen" | null
                        showImageBorder?: boolean | null
                    }
                    const isImageLeft = itemSettings.sectionLayout === "imageLeft"
                    const isFullscreen = itemSettings.sectionLayout === "imageFullscreen"
                    const isSideFullscreen = itemSettings.sectionLayout === "imageRightFullscreen" || itemSettings.sectionLayout === "imageLeftFullscreen"
                    const isSideFullscreenLeft = itemSettings.sectionLayout === "imageLeftFullscreen"
                    const isSideFullscreenRight = itemSettings.sectionLayout === "imageRightFullscreen"

                    const showImageBorder = itemSettings.showImageBorder ?? true
                    return (
                        <article
                            data-scroll-card-article
                            key={item.id ?? `${item.title}-${index}`}
                            className="absolute inset-0 flex items-center justify-center will-change-transform"
                            style={{
                                opacity: 1,
                                transform: `translate3d(0, ${index === 0 ? "0" : "calc(100% + 6rem)"}, 0)`,
                                zIndex: index + 1,
                            }}
                        >
                            <Card
                                size="lg"
                                gradientDirection={item.gradientDirection}
                                radialGradient={item.gradient}
                                className={cn(
                                    "relative h-full w-full shrink-0 overflow-x-hidden overflow-y-auto bg-primary md:h-auto md:w-(--scroll-card-width) md:aspect-video md:overflow-hidden",
                                    isFullscreen ? "p-0" : isSideFullscreen ? "grid p-0 md:grid-cols-2" : "grid gap-6 p-6 sm:gap-8 sm:p-8 md:gap-12 md:p-12 md:grid-cols-[0.95fr_1.05fr]"
                                )}
                            >
                                {isFullscreen ? (
                                    <div className={cn("relative z-10 h-full w-full overflow-hidden rounded-3xl", showImageBorder && "border border-white/10")}>
                                        {imageUrl && <Image src={imageUrl} alt={image?.alt ?? item.title} fill sizes="100vw" className="object-cover object-center" />}

                                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                                            <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
                                                <h2 className="text-3xl font-semibold text-white md:text-5xl">{item.title}</h2>

                                                {item.description && <p className="max-w-2xl text-base leading-7 text-secondary md:text-lg">{item.description}</p>}

                                                <div className="space-y-6">
                                                    <ul className="grid gap-2 text-sm text-secondary md:text-base">
                                                        {item.bulletPoints?.map((point, pointIndex) => (
                                                            <li key={`${item.id ?? item.title}-point-${pointIndex}`} className="flex items-start gap-3">
                                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {item.link?.label && item.link?.url && <LinkButton href={item.link.url}>{item.link.label}</LinkButton>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isSideFullscreen ? (
                                    <>
                                        <div className={cn("relative z-10 flex flex-col justify-center gap-6 p-6 sm:p-8 md:h-full md:gap-8 md:p-12", isSideFullscreenLeft && "md:order-2")}>
                                            <div className="flex flex-col gap-4">
                                                <h2 className="max-w-xl text-3xl font-semibold text-white md:text-5xl">{item.title}</h2>
                                                <p className="max-w-xl text-base leading-7 text-secondary md:text-lg">{item.description}</p>
                                            </div>

                                            <div className="space-y-6">
                                                <ul className="grid gap-2 text-sm text-secondary md:text-base">
                                                    {item.bulletPoints?.map((point, pointIndex) => (
                                                        <li key={`${item.id ?? item.title}-point-${pointIndex}`} className="flex items-start gap-3">
                                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {item.link?.label && item.link?.url && <LinkButton href={item.link.url}>{item.link.label}</LinkButton>}
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "relative z-10 min-h-64 w-full overflow-hidden mt-px md:h-full",
                                                showImageBorder && "border-white/5",
                                                isSideFullscreenLeft && "md:order-1 border-r",
                                                isSideFullscreenRight && "border-l"
                                            )}
                                        >
                                            {imageUrl && <Image src={imageUrl} alt={image?.alt ?? item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-center" />}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={cn("relative z-10 flex h-full flex-col justify-center gap-8 rounded-3xl", isImageLeft && "md:order-2")}>
                                            <div className="flex flex-col gap-4">
                                                <h2 className="max-w-xl text-3xl font-semibold text-white md:text-5xl">{item.title}</h2>
                                                {item.description && <p className="max-w-xl text-base leading-7 text-secondary md:text-lg">{item.description}</p>}
                                            </div>

                                            <div className="space-y-6">
                                                <ul className="grid gap-2 text-sm text-secondary md:text-base">
                                                    {item.bulletPoints?.map((point, pointIndex) => (
                                                        <li key={`${item.id ?? item.title}-point-${pointIndex}`} className="flex items-start gap-3">
                                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {item.link?.label && item.link?.url && <LinkButton href={item.link.url}>{item.link.label}</LinkButton>}
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "relative z-10 aspect-video w-full self-center overflow-hidden rounded-2xl",
                                                showImageBorder && "border border-white/10",
                                                isImageLeft && "md:order-1"
                                            )}
                                        >
                                            {imageUrl && <Image src={imageUrl} alt={image?.alt ?? item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-center" />}
                                        </div>
                                    </>
                                )}
                            </Card>
                        </article>
                    )
                })}
            </ScrollCardPinning>
        </Section>
    )
}
