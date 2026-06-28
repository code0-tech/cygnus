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
    "[&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1:first-child]:mt-0 [&_h1]:tracking-normal",
    "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2:first-child]:mt-0 [&_h2]:tracking-normal",
    "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:first-child]:mt-0 [&_h3]:tracking-normal",
    "[&_h4]:mb-2 [&_h4]:mt-7 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug [&_h4:first-child]:mt-0 [&_h4]:tracking-normal",
    "[&_p]:mb-4 [&_p]:text-secondary [&_p]:leading-6",
    "[&_strong]:tracking-wide [&_strong]:text-white",
    "[&_ul]:mb-4 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:mb-4 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_li]:text-secondary [&_li]:mb-2",
    "[&_li::marker]:text-tertiary",
    "[&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/30 [&_pre]:p-4",
    "[&_code]:font-mono [&_code]:text-sm [&_code]:text-white",
    "[&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-white/5",
    "[&_a]:relative [&_a]:inline-block [&_a]:text-brand! [&_a]:no-underline [&_a]:transition-colors [&_a]:after:pointer-events-none [&_a]:after:absolute [&_a]:after:bottom-0 [&_a]:after:left-0 [&_a]:after:h-px [&_a]:after:w-full [&_a]:after:origin-left [&_a]:after:scale-x-0 [&_a]:after:bg-current [&_a]:after:transition-transform [&_a]:after:duration-300 [&_a]:after:ease-out [&_a:hover]:after:scale-x-100",
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
                    return <div key={`html-${index}`} className={index === segments.length - 1 ? "[&>*:last-child]:mb-0" : undefined} dangerouslySetInnerHTML={{ __html: segment.html }} />
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
