"use client"

import ReactPlayer from "react-player"
import { useState } from "react"

interface VideoPlayerProps {
    autoPlay?: boolean
    controls?: boolean
    loop?: boolean
    muted?: boolean
    playsInline?: boolean
    posterUrl?: string
    source: string
}

export function VideoPlayer({ autoPlay = false, controls = true, loop = false, muted = false, playsInline = true, posterUrl, source }: VideoPlayerProps) {
    const [hasError, setHasError] = useState(false)

    if (hasError) {
        return (
            <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-secondary" role="alert">
                Video could not be loaded.
            </div>
        )
    }

    return (
        <ReactPlayer
            className="relative z-10"
            src={source}
            controls={controls}
            playing={autoPlay}
            muted={muted}
            loop={loop}
            playsInline={playsInline}
            light={!autoPlay && posterUrl ? posterUrl : false}
            poster={posterUrl || undefined}
            previewAriaLabel="Play video"
            onError={() => setHasError(true)}
            width="100%"
            height="100%"
            style={{ width: "100%", height: "100%" }}
        />
    )
}
