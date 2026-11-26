import { cn } from "@/lib/utils"

interface PlaygroundThumbnailProps {
    title: string
    url: string
    className?: string
}

export function PlaygroundThumbnail({ title, url, className }: PlaygroundThumbnailProps) {
    const source = url.trim()
    if (!source) return null

    return (
        <div className={cn("relative overflow-hidden rounded-2xl bg-primary/40", className)}>
            <iframe
                src={source}
                title={`${title} playground thumbnail`}
                loading="lazy"
                aria-hidden="true"
                tabIndex={-1}
                className="pointer-events-none absolute inset-0 size-full border-0"
            />
        </div>
    )
}
