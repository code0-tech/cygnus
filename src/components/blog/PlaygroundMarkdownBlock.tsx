import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { validatePlaygroundUrl } from "@/fields/playgroundMediaFields"

interface PlaygroundMarkdownBlockProps {
    source: string
    title?: string
}

export function PlaygroundMarkdownBlock({ source, title }: PlaygroundMarkdownBlockProps) {
    const url = source.trim()
    if (validatePlaygroundUrl(url) !== true) return null

    const heading = title?.trim()

    return (
        <div className="my-6 overflow-hidden rounded-3xl bg-light ring ring-white/10">
            {heading && <div className="flex items-center gap-2 border-b border-white/10 bg-primary/50 px-6 py-3 text-xs font-semibold tracking-wide text-secondary">{heading}</div>}
            <div className="relative h-96 sm:h-[32rem]">
                <PlaygroundFrame url={url} title={heading || "Playground"} />
            </div>
        </div>
    )
}
