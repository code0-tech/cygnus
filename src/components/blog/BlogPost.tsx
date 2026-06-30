import { getBlogPostBySlug } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { customLexicalHTMLConverters } from "@/lib/richText/customHTMLConverters"
import type { AppLocale } from "@/lib/i18n"
import type { Blog, Media, TeamMember } from "@/payload-types"
import { IconArrowLeft } from "@tabler/icons-react"
import { convertLexicalToHTMLAsync } from "@payloadcms/richtext-lexical/html-async"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MarkdownContent } from "./MarkdownContent"
import { TableOfContents, type TocHeading } from "./TableOfContents"
import { LinkButton } from "../ui/LinkButton"
import { Card } from "../ui/Card"

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

    let text = ""
    for (const child of node.children) text += extractText(child)
    return text
}

const getInitials = (name: string) => {
    let initials = ""

    for (const part of name.split(" ")) {
        if (!part) continue
        initials += part.charAt(0)
        if (initials.length === 2) break
    }

    return initials.toUpperCase()
}

const getTocHeadings = (content: Blog["content"]): TocHeading[] => {
    const rootChildren = (content as { root?: { children?: LexicalNode[] } })?.root?.children ?? []
    const counts = new Map<string, number>()

    const headings: TocHeading[] = []

    for (const node of rootChildren) {
        if (node.type !== "heading" || !/^h[1-6]$/.test(node.tag ?? "")) continue

        const text = extractText(node).trim()
        if (!text) continue

        const base = slugify(text) || "section"
        const count = counts.get(base) ?? 0
        counts.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count + 1}`
        const level = Number((node.tag ?? "h2").slice(1)) as 1 | 2 | 3 | 4 | 5 | 6
        headings.push({ id, text, level })
    }

    return headings
}

const injectHeadingIds = (html: string, headings: TocHeading[]): string => {
    let index = 0

    return html.replace(/<h([1-6])([^>]*)>/g, (match, level, attributes) => {
        const heading = headings[index]
        index += 1
        if (!heading) return match

        const nextAttributes = /\sclass=/.test(attributes)
            ? attributes.replace(/\sclass=(['"])(.*?)\1/, (_classMatch: string, quote: string, className: string) => ` class=${quote}${className} scroll-mt-32${quote}`)
            : `${attributes} class="scroll-mt-32"`

        if (/\sid=/.test(nextAttributes)) return `<h${level}${nextAttributes}>`
        return `<h${level}${nextAttributes} id="${heading.id}">`
    })
}

export async function BlogPost({ slug, locale }: BlogPostProps) {
    const post = await getBlogPostBySlug(slug, locale)
    if (!post) notFound()

    const heroImage = post.heroImage as Media
    const author = typeof post.author === "number" ? null : (post.author as TeamMember)
    const authorImage = author?.image && typeof author.image !== "number" ? author.image : undefined
    const heroImageUrl = getMediaUrl(heroImage?.url)
    const authorImageUrl = getMediaUrl(authorImage?.url)
    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    const headings = getTocHeadings(post.content)
    const contentHtml = await convertLexicalToHTMLAsync({
        converters: customLexicalHTMLConverters,
        data: post.content,
        disableContainer: true,
    })
    const contentHtmlWithIds = injectHeadingIds(contentHtml, headings)

    return (
        <div className="space-y-8">
            <div className="flex justify-start">
                <LinkButton href={`/${locale}/blog`} showArrow={false} className="border-0 hover:bg-white/10 pl-2.5 pr-4 py-1 rounded-[10px] hover:text-white after:hidden">
                    <IconArrowLeft size={16} />
                    {locale === "de" ? "Zurück" : "Back"}
                </LinkButton>
            </div>

            <header className="text-center">
                <h1 className="text-4xl font-semibold mb-3">{post.title}</h1>
                {post.shortDescription ? <p className="text-balance text-lg text-secondary mb-4">{post.shortDescription}</p> : null}
            </header>

            {heroImageUrl ? (
                <Card size="lg" className="p-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5">
                        <Image src={heroImageUrl} alt={heroImage.alt ?? post.title} fill priority sizes="(min-width: 1024px) 75vw, 100vw" className="object-cover" />
                    </div>
                </Card>
            ) : (
                <Card size="lg" className="p-2">
                    <div className="aspect-video w-full rounded-2xl border border-white/5 bg-white/10 flex items-center justify-center text-tertiary text-sm">
                        {locale === "de" ? "Kein Hero-Bild vorhanden" : "No hero image available"}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                <aside className="space-y-6">
                    {author ? (
                        <div className="flex gap-3 text-sm text-tertiary">
                            {authorImageUrl ? (
                                <Image src={authorImageUrl} alt={authorImage?.alt ?? author.name} width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
                            ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-secondary">{getInitials(author.name)}</div>
                            )}
                            <div className="min-w-0 text-left">
                                <p className="font-medium text-secondary">{author.name}</p>
                                <p className="text-xs text-tertiary">{author.role}</p>
                                <p className="text-xs text-tertiary">{publishedDate}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">{publishedDate}</p>
                    )}

                    <TableOfContents headings={headings} />
                </aside>
                <article className="lg:col-span-3">
                    <MarkdownContent content={contentHtmlWithIds} />
                </article>
            </div>
        </div>
    )
}
