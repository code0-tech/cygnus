import { Section } from "@/components/ui/Section"
import type { VideoLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import { VideoPlayer } from "./client/VideoPlayer"

interface VideoSectionProps {
    content?: VideoLayoutBlock | null
}

function getMedia(value: number | Media | null | undefined) {
    return value && typeof value === "object" ? value : null
}

export function VideoSection({ content }: VideoSectionProps) {
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
                <VideoPlayer
                    source={source}
                    controls={content.controls ?? true}
                    autoPlay={autoPlay}
                    muted={muted}
                    loop={content.loop ?? false}
                    playsInline={content.playsInline ?? true}
                    posterUrl={posterUrl}
                />
            </div>
        </Section>
    )
}
