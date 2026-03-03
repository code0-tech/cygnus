import { getBlogPostBySlug } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { Blog } from "@/payload-types"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"
import { MarkdownContent } from "../MarkdownContent"
import { TableOfContents, type TocHeading } from "./TableOfContents"

interface BlogPostProps {
    slug: string
    locale: AppLocale
}

interface LexicalNode {
    type?: string
    tag?: string
    text?: string
    children?: LexicalNode[]
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")

const extractText = (node?: LexicalNode): string => {
    if (!node) return ""
    if (typeof node.text === "string") return node.text
    if (!Array.isArray(node.children)) return ""
    return node.children.map((child) => extractText(child)).join("")
}

const getTocHeadings = (content: Blog["content"]): TocHeading[] => {
    const rootChildren = (content as { root?: { children?: LexicalNode[] } })?.root?.children ?? []
    const counts = new Map<string, number>()

    return rootChildren
        .filter((node) => node.type === "heading" && /^h[1-6]$/.test(node.tag ?? ""))
        .map((node) => {
            const text = extractText(node).trim()
            if (!text) return null

            const base = slugify(text) || "section"
            const count = counts.get(base) ?? 0
            counts.set(base, count + 1)
            const id = count === 0 ? base : `${base}-${count + 1}`
            const level = Number((node.tag ?? "h2").slice(1)) as 1 | 2 | 3 | 4 | 5 | 6

            return { id, text, level }
        })
        .filter((item): item is TocHeading => item !== null)
}

const injectHeadingIds = (html: string, headings: TocHeading[]): string => {
    let index = 0

    return html.replace(/<h([1-6])([^>]*)>/g, (match, level, attributes) => {
        const heading = headings[index]
        index += 1
        if (!heading) return match
        if (/\sid=/.test(attributes)) return match
        return `<h${level}${attributes} id="${heading.id}">`
    })
}

export async function BlogPost({ slug, locale }: BlogPostProps) {
    const post = await getBlogPostBySlug(slug, locale)
    if (!post) notFound()

    const author = typeof post.author === "object" && post.author !== null ? post.author.name : "Unknown author"
    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    const headings = getTocHeadings(post.content)
    const contentHtml = convertLexicalToHTML({
        data: post.content,
        disableContainer: true,
    })
    const contentHtmlWithIds = injectHeadingIds(contentHtml, headings)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <TableOfContents headings={headings} />
            <article className="lg:col-span-3">
                <h1 className={"text-4xl font-semibold mb-2"}>{post.title}</h1>
                <p className="text-sm text-white/60 mb-8">
                    {author} - {publishedDate}
                </p>
                <MarkdownContent content={contentHtmlWithIds}/>
            </article>
        </div>
    )
}
