"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { ScrollCardsLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { m as motion } from "motion/react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"

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

const cardGradients = {
    blue: "rgba(114,201,248,0.2)",
    yellow: "rgba(248,241,114,0.2)",
    pink: "rgba(248,114,226,0.2)",
    aqua: "rgba(122,203,255,0.2)",
    brand: "rgba(145,232,120,0.2)",
    neutral: "rgba(255,255,255,0.1)",
} as const

const gradientDirections = {
    topLeft: "top left",
    topRight: "top right",
    bottomLeft: "bottom left",
    bottomRight: "bottom right",
} as const

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
    const activeShadowIndex = Math.min(
        items.length - 1,
        Math.floor(scrollProgress / viewportHeight) + 1,
    )

    return (
        <Section showBlur={false} showFunnel={false} animationPreset="none">
            <div
                ref={containerRef}
                className="relative"
                style={{ height: `${Math.max(items.length, 1) * 100}vh` }}
            >
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
                    const itemSettings = item as {
                        gradient?: keyof typeof cardGradients | null
                        gradientDirection?: keyof typeof gradientDirections | null
                        sectionLayout?: "imageRight" | "imageLeft" | null
                        showImageBorder?: boolean | null
                    }
                    const isImageLeft = itemSettings.sectionLayout === "imageLeft"
                    const showImageBorder = itemSettings.showImageBorder ?? true
                    const gradient = cardGradients[itemSettings.gradient ?? "blue"] ?? cardGradients.blue
                    const gradientDirection = gradientDirections[itemSettings.gradientDirection ?? "topLeft"] ?? gradientDirections.topLeft
                    const segmentProgress = index === 0
                        ? 1
                        : clamp((scrollProgress - (index - 1) * viewportHeight) / viewportHeight, 0, 1)
                    const translateY = (1 - segmentProgress) * 100

                    return (
                        <motion.article
                            key={item.id ?? `${item.title}-${index}`}
                            className={cn(
                                "absolute inset-0 will-change-transform [&>div]:shadow-none!",
                                index === activeShadowIndex && "[&>div]:shadow-[0_16px_44px_rgba(0,0,0,0.3)]!",
                            )}
                            style={{
                                opacity: 1,
                                transform: `translateY(${translateY}%)`,
                                zIndex: index + 1,
                            }}
                        >
                            <div
                                className="relative grid h-[80%] overflow-hidden rounded-3xl border border-white/10 bg-primary! p-4 md:grid-cols-[0.95fr_1.05fr] shadow-xl"
                            >
                                <div aria-hidden="true" className="glass-card-topline" />
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        backgroundImage: `radial-gradient(circle at ${gradientDirection}, ${gradient}, transparent 36%)`,
                                    }}
                                />

                                <div className={cn(
                                    "relative z-10 flex h-full flex-col justify-between gap-10 rounded-3xl p-4 md:p-8",
                                    isImageLeft && "md:order-2",
                                )}>
                                    <div className="flex flex-col gap-4">
                                        <h2 className="max-w-xl text-3xl font-semibold text-white md:text-5xl">
                                            {item.title}
                                        </h2>
                                        <p className="max-w-xl text-base leading-7 text-white/75 md:text-lg">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {item.bulletPoints?.length ? (
                                            <ul className="grid gap-2 text-sm text-white/75 md:text-base">
                                                {item.bulletPoints.map((point, pointIndex) => (
                                                    <li key={`${item.id ?? item.title}-point-${pointIndex}`} className="flex items-start gap-3">
                                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}

                                        {item.link?.label && item.link?.url ? (
                                            <LinkButton href={item.link.url}>
                                                {item.link.label}
                                            </LinkButton>
                                        ) : null}
                                    </div>
                                </div>

                                <div className={cn(
                                    "relative z-10 aspect-video w-full self-center overflow-hidden rounded-2xl",
                                    showImageBorder && "border border-white/10",
                                    isImageLeft && "md:order-1",
                                )}>
                                    {image?.url && (
                                        <Image
                                            src={image.url}
                                            alt={image.alt ?? item.title}
                                            fill
                                            sizes="(min-width: 768px) 50vw, 100vw"
                                            className="object-contain object-center"
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.article>
                    )
                })}
                </div>
            </div>
        </Section>
    )
}
