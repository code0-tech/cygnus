import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { Section } from "@/components/ui/Section"
import type { CTAImageLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { Fragment } from "react"

interface CTAImageSectionProps {
    content?: CTAImageLayoutBlock | null
}

const IMAGE_MASK_CLASSES = {
    top: "inset-x-0 top-0 h-1/3 bg-linear-to-b from-primary to-transparent",
    right: "inset-y-0 right-0 w-1/3 bg-linear-to-l from-primary to-transparent",
    bottom: "inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-primary to-transparent",
    left: "inset-y-0 left-0 w-1/3 bg-linear-to-r from-primary to-transparent",
} as const

export function CTAImageSection({ content }: CTAImageSectionProps) {
    if (!content?.title) return null

    const texts = content.texts?.flatMap((item) => (item.text ? [item.text] : [])) ?? []
    const buttons = content.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const image = content.image && typeof content.image === "object" ? (content.image as Media) : null
    const imageUrl = getMediaUrl(image?.url) || "/code0_software.png"
    const imageWidth = image?.width || 900
    const imageHeight = image?.height || 620
    const showCard = content.showCard !== false
    const showImageBorder = content.showImageBorder ?? true
    const isPlayground = content.mediaType === "playground"

    return (
        <Section showFunnel={false} animation={{ preset: "none" }}>
            <div
                className={cn(
                    "relative isolate",
                    showCard && "overflow-hidden rounded-4xl border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]"
                )}
            >
                {showCard && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full bg-[radial-gradient(circle_at_18%_24%,rgba(5,8,18,0.68),transparent_40%),linear-gradient(90deg,rgba(5,8,18,0.56)_0%,rgba(5,8,18,0.28)_34%,transparent_62%)] lg:w-[56%]"
                    />
                )}

                <StaggerContainer className={cn("relative z-20 flex min-h-0 flex-col items-center justify-between gap-8 lg:flex-row", showCard ? "rounded-3xl p-8 lg:p-16" : "p-0")}>
                    <div className={cn("flex w-full flex-col gap-4 text-center lg:text-start", showCard ? "lg:w-2/5" : "lg:w-[42%]")}>
                        <StaggerItem as="h2" className="relative z-10 text-balance text-3xl font-bold text-white lg:text-4xl">
                            {content.title}
                        </StaggerItem>

                        {texts.length > 0 && (
                            <StaggerItem as="p" className="relative z-10 text-pretty text-base font-medium text-white lg:text-xl">
                                {texts.map((text, index) => (
                                    <Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </Fragment>
                                ))}
                            </StaggerItem>
                        )}

                        {buttons.length > 0 && (
                            <StaggerItem className="mt-4 flex flex-col gap-2 sm:gap-4">
                                {buttons.map((button, index) => (
                                    <HapticButtonLink
                                        href={button.url}
                                        key={`${button.label}-${button.id ?? index}`}
                                        variant={button.variant ?? "normal"}
                                        className={cn(button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                    >
                                        {button.label}
                                    </HapticButtonLink>
                                ))}
                            </StaggerItem>
                        )}
                    </div>

                    <div className={cn("h-auto w-full", showCard ? "lg:w-4/5 lg:-mr-56" : "lg:w-[58%]")}>
                        <div className={cn(showCard ? "rounded-[1.3rem] bg-white/10 p-1 lg:rounded-l-[1.3rem] lg:rounded-r-none" : "rounded-2xl", showImageBorder && "border border-white/20")}>
                            <div className={cn("relative overflow-hidden", showCard ? "rounded-2xl lg:rounded-l-2xl lg:rounded-r-none" : "rounded-2xl")}>
                                {isPlayground ? (
                                    <div className="relative aspect-video w-full">
                                        <PlaygroundFrame url={content.playgroundUrl} title={`${content.title} playground`} />
                                    </div>
                                ) : (
                                    <Image
                                        src={imageUrl}
                                        alt={image?.alt || content.title}
                                        height={imageHeight}
                                        width={imageWidth}
                                        sizes="(min-width: 1024px) 60vw, 100vw"
                                        className={cn("block h-auto w-full", showCard ? "rounded-2xl lg:rounded-l-2xl lg:rounded-r-none" : "rounded-2xl")}
                                    />
                                )}
                                {content.imageMask?.map((side) => (
                                    <div key={side} aria-hidden="true" className={cn("pointer-events-none absolute z-10", IMAGE_MASK_CLASSES[side])} />
                                ))}
                            </div>
                        </div>
                    </div>
                </StaggerContainer>
            </div>
        </Section>
    )
}
