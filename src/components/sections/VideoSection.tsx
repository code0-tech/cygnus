"use client"

import { Section } from "@/components/ui/Section"
import type { VideoLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import ReactPlayer from "react-player"
import { useState } from "react"

interface VideoSectionProps {
    content?: VideoLayoutBlock | null
}

function getMedia(value: number | Media | null | undefined) {
    return value && typeof value === "object" ? value : null
}

export function VideoSection({ content }: VideoSectionProps) {
    const [hasError, setHasError] = useState(false)

    if (!content) return null

    const videoMedia = getMedia(content.video)
    const posterMedia = getMedia(content.poster)
    const source = content.sourceType === "media" ? getMediaUrl(videoMedia?.url) : content.videoUrl?.trim()
    const posterUrl = getMediaUrl(posterMedia?.url)

    if (!source) return null

    const autoPlay = content.autoPlay ?? false
    const muted = autoPlay || (content.muted ?? false)

    return (
        <Section heading={content.sectionHeading} description={content.sectionDescription} linkButton={content.sectionLinkButton} funnelType="center" animation={{ preset: "none" }}>
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/5 bg-primary">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" aria-hidden="true" />
                {hasError ? (
                    <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-secondary" role="alert">
                        Video could not be loaded.
                    </div>
                ) : (
                    <ReactPlayer
                        className="relative z-10"
                        src={source}
                        controls={content.controls ?? true}
                        playing={autoPlay}
                        muted={muted}
                        loop={content.loop ?? false}
                        playsInline={content.playsInline ?? true}
                        light={!autoPlay && posterUrl ? posterUrl : false}
                        poster={posterUrl || undefined}
                        previewAriaLabel="Play video"
                        onError={() => setHasError(true)}
                        width="100%"
                        height="100%"
                        style={{ width: "100%", height: "100%" }}
                    />
                )}
            </div>
        </Section>
    )
}
