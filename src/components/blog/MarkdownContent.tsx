import { GraphMarkdownBlock } from "@/components/blog/GraphMarkdownBlock"
import { TriggerMarkdownBlock } from "@/components/blog/TriggerMarkdownBlock"

interface MarkdownContentProps {
    content: string
}

interface HtmlSegment {
    type: "html"
    html: string
}

interface TagSegment {
    type: "tag"
    language: string
    value: string
}

interface CustomBlockSegment {
    type: "custom-block"
    blockType: string
    title: string
    value: string
}

type MarkdownSegment = HtmlSegment | TagSegment | CustomBlockSegment

const CUSTOM_TAG_COMPONENTS = {
    graph: GraphMarkdownBlock,
    trigger: TriggerMarkdownBlock,
} as const

const htmlClassName = [
    "[&_h1]:mb-5 [&_h1]:mt-12 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1:first-child]:mt-0",
    "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2:first-child]:mt-0",
    "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:first-child]:mt-0",
    "[&_h4]:mb-3 [&_h4]:mt-7 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug [&_h4:first-child]:mt-0",
    "[&_p]:mb-5 [&_p]:text-white/75 [&_p]:leading-7",
    "[&_ul]:mb-6 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:mb-6 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_li]:text-white/75 [&_li]:mb-2",
    "[&_li::marker]:text-white/50",
    "[&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/30 [&_pre]:p-4",
    "[&_code]:font-mono [&_code]:text-sm [&_code]:text-white/90",
    "[&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-white/5 [&_img]:shadow-md",
    "[&_a]:text-brand! [&_a]:hover:underline [&_a]:underline-offset-4 [&_a]:decoration-brand/45 hover:[&_a]:decoration-brand",
].join(" ")

const decodeHtmlEntities = (value: string) =>
    value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")

const getCodeLanguage = (className: string) => {
    const match = className.match(/(?:^|\s)(?:language|lang)-([a-z0-9_-]+)(?:\s|$)/i)
    return match?.[1]?.toLowerCase() ?? null
}

const splitMarkdownContent = (content: string): MarkdownSegment[] => {
    const segments: MarkdownSegment[] = []
    const pattern = /<div\s+data-lexical-custom-block="([^"]+)"\s+data-source="([^"]*)"\s+data-title="([^"]*)"\s*><\/div>|<pre>\s*<code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code>\s*<\/pre>/gi
    let lastIndex = 0
    let match = pattern.exec(content)

    while (match) {
        const [fullMatch, customBlockType = "", customSource = "", customTitle = "", className = "", rawValue = ""] = match
        const startIndex = match.index

        if (startIndex > lastIndex) {
            segments.push({ type: "html", html: content.slice(lastIndex, startIndex) })
        }

        if (customBlockType && customBlockType in CUSTOM_TAG_COMPONENTS) {
            segments.push({
                type: "custom-block",
                blockType: customBlockType,
                title: decodeURIComponent(customTitle),
                value: decodeURIComponent(customSource),
            })
        } else {
            const language = getCodeLanguage(className)

            if (language && language in CUSTOM_TAG_COMPONENTS) {
                segments.push({
                    type: "tag",
                    language,
                    value: decodeHtmlEntities(rawValue).trim(),
                })
            } else {
                segments.push({ type: "html", html: fullMatch })
            }
        }

        lastIndex = startIndex + fullMatch.length
        match = pattern.exec(content)
    }

    if (lastIndex < content.length) {
        segments.push({ type: "html", html: content.slice(lastIndex) })
    }

    return segments
}

export function MarkdownContent({ content }: MarkdownContentProps) {
    const segments = splitMarkdownContent(content)

    return (
        <div className={htmlClassName}>
            {segments.map((segment, index) => {
                if (segment.type === "html") {
                    return (
                        <div
                            key={`html-${index}`}
                            className={index === segments.length - 1 ? "[&>*:last-child]:mb-0" : undefined}
                            dangerouslySetInnerHTML={{ __html: segment.html }}
                        />
                    )
                }

                if (segment.type === "custom-block") {
                    const Component = CUSTOM_TAG_COMPONENTS[segment.blockType as keyof typeof CUSTOM_TAG_COMPONENTS]
                    return <Component key={`${segment.blockType}-${index}`} source={segment.value} title={segment.title} />
                }

                const Component = CUSTOM_TAG_COMPONENTS[segment.language as keyof typeof CUSTOM_TAG_COMPONENTS]
                return <Component key={`${segment.language}-${index}`} source={segment.value} />
            })}
        </div>
    )
}
