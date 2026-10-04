import { cn } from "@/lib/utils"

interface PlaygroundFrameProps {
    className?: string
    title: string
    url?: string | null
}

export function PlaygroundFrame({ className, title, url }: PlaygroundFrameProps) {
    const source = url?.trim()
    if (!source) return null

    return (
        <iframe
            src={source}
            title={title}
            loading="lazy"
            allow="clipboard-read; clipboard-write"
            allowFullScreen
            className={cn("absolute inset-0 block size-full border-0 bg-primary", className)}
        />
    )
}
