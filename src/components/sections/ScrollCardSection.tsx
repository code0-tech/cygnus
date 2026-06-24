"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { ScrollCardsLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { m as motion } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Card } from "../ui/Card"

interface ScrollCardSectionProps {
    content?: ScrollCardsLayoutBlock | null
}

interface PinState {
    phase: "before" | "active" | "after"
    left: number
    width: number
}

function getImage(image: number | Media | null | undefined) {
    return typeof image === "object" ? image : null
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

export function ScrollCardSection({ content }: ScrollCardSectionProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [viewportHeight, setViewportHeight] = useState(1)
    const [pinState, setPinState] = useState<PinState>({
        phase: "before",
        left: 0,
        width: 0,
    })
    const items = content?.items?.filter((item) => Boolean(item.title)) ?? []

    useEffect(() => {
        let frame = 0

        const updateProgress = () => {
            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const topOffset = 96
            const height = window.innerHeight
            const containerTop = rect.top + window.scrollY
            const rawProgress = window.scrollY - containerTop
            const activeEnd = Math.max((items.length - 1) * height, 0)

            setViewportHeight(height)
            setScrollProgress(clamp(rawProgress, 0, activeEnd))
            setPinState({
                phase: rect.top > topOffset ? "before" : rect.bottom <= height ? "after" : "active",
                left: rect.left,
                width: rect.width,
            })
        }

        const handleViewportChange = () => {
            if (frame) return
            frame = window.requestAnimationFrame(() => {
                frame = 0
                updateProgress()
            })
        }

        updateProgress()
        window.addEventListener("scroll", handleViewportChange, { passive: true })
        window.addEventListener("resize", handleViewportChange)

        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("scroll", handleViewportChange)
            window.removeEventListener("resize", handleViewportChange)
        }
    }, [])

    if (items.length === 0) return null

    return (
        <Section showFunnel={false} animation={{ preset: "none" }}>
            <div ref={containerRef} className="relative" style={{ height: `${Math.max(items.length, 1) * 100}vh` }}>
                <div
                    className="h-[calc(100vh-6rem)]"
                    style={{
                        left: pinState.phase === "active" ? pinState.left : undefined,
                        position: pinState.phase === "active" ? "fixed" : pinState.phase === "after" ? "absolute" : "relative",
                        right: pinState.phase === "active" ? "auto" : undefined,
                        top: pinState.phase === "active" ? 96 : pinState.phase === "after" ? "auto" : undefined,
                        bottom: pinState.phase === "after" ? 0 : undefined,
                        width: pinState.phase === "active" ? pinState.width : "100%",
                        zIndex: 10,
                    }}
                >
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
                        const segmentProgress = index === 0 ? 1 : clamp((scrollProgress - (index - 1) * viewportHeight) / viewportHeight, 0, 1)
                        const translateY = (1 - segmentProgress) * 100

                        return (
                            <motion.article
                                key={item.id ?? `${item.title}-${index}`}
                                className="absolute inset-0 will-change-transform"
                                style={{
                                    opacity: 1,
                                    transform: `translateY(${translateY}%)`,
                                    zIndex: index + 1,
                                }}
                            >
                                <Card
                                    size="lg"
                                    gradientDirection={item.gradientDirection}
                                    radialGradient={item.gradient}
                                    className={cn(
                                        isFullscreen
                                            ? "relative h-[80%] overflow-hidden bg-primary p-0"
                                            : isSideFullscreen
                                              ? "relative grid h-[80%] overflow-hidden bg-primary p-0 md:grid-cols-2"
                                              : "relative grid h-[80%] overflow-hidden bg-primary p-12 gap-12 md:grid-cols-[0.95fr_1.05fr]"
                                    )}
                                >
                                    {isFullscreen ? (
                                        <div className={cn("relative z-10 h-full w-full overflow-hidden rounded-3xl", showImageBorder && "border border-white/10")}>
                                            {imageUrl && <Image src={imageUrl} alt={image?.alt ?? item.title} fill sizes="100vw" className="object-cover object-center" />}

                                            <div className="absolute inset-0 z-20 flex items-center justify-center">
                                                <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
                                                    <h2 className="text-3xl font-semibold text-white md:text-5xl">{item.title}</h2>

                                                    {item.description && <p className="max-w-2xl text-base leading-7 text-white/80 md:text-lg">{item.description}</p>}

                                                    <div className="space-y-6">
                                                        <ul className="grid gap-2 text-sm text-white/75 md:text-base">
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
                                            <div className={cn("relative z-10 flex h-full flex-col justify-center gap-8 p-12", isSideFullscreenLeft && "md:order-2")}>
                                                <div className="flex flex-col gap-4">
                                                    <h2 className="max-w-xl text-3xl font-semibold text-white md:text-5xl">{item.title}</h2>
                                                    <p className="max-w-xl text-base leading-7 text-white/75 md:text-lg">{item.description}</p>
                                                </div>

                                                <div className="space-y-6">
                                                    <ul className="grid gap-2 text-sm text-white/75 md:text-base">
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
                                                    "relative z-10 h-full w-full overflow-hidden mt-px",
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
                                                    {item.description && <p className="max-w-xl text-base leading-7 text-white/75 md:text-lg">{item.description}</p>}
                                                </div>

                                                <div className="space-y-6">
                                                    <ul className="grid gap-2 text-sm text-white/75 md:text-base">
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
                                                {imageUrl && (
                                                    <Image src={imageUrl} alt={image?.alt ?? item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-center" />
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </motion.article>
                        )
                    })}
                </div>
            </div>
        </Section>
    )
}
