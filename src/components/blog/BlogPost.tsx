import { getBlogPostBySlug } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { Blog, Media, User } from "@/payload-types"
import { IconArrowLeft } from "@tabler/icons-react"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MarkdownContent } from "../MarkdownContent"
import { TableOfContents, type TocHeading } from "./TableOfContents"
import { LinkButton } from "../ui/LinkButton"

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

    const heroImage = post.heroImage as Media
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
        <div className="space-y-8">
            <div className="flex justify-start">
                <LinkButton
                    href={`/${locale}/blog`}
                    showArrow={false}
                    className="border-0"
                >
                    <IconArrowLeft size={16} />
                    {locale === "de" ? "Zurück" : "Back"}
                </LinkButton>
            </div>

            <header className="text-center">
                <h1 className="text-4xl font-semibold mb-3">{post.title}</h1>
                {post.shortDescription ? <p className="text-balance text-lg text-white/70 mb-4">{post.shortDescription}</p> : null}
                <p className="text-sm text-white/60">
                    {(post.author as User).name} - {publishedDate}
                </p>
            </header>

            {heroImage?.url ? (
                <div className="relative rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-md">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent" />
                    <div className="relative aspect-video md:aspect-16/7 lg:aspect-16/5 w-full overflow-hidden rounded-2xl ring ring-white/10">
                        <Image
                            src={heroImage.url}
                            alt={heroImage.alt ?? post.title}
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </div>
            ) : (
                <div className="relative rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-md">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent" />
                    <div className="aspect-video md:aspect-16/7 lg:aspect-16/5 w-full rounded-2xl ring ring-white/10 bg-white/5 flex items-center justify-center text-white/50 text-sm">
                        {locale === "de" ? "Kein Hero-Bild vorhanden" : "No hero image available"}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <TableOfContents headings={headings} />
                <article className="lg:col-span-3">
                    <MarkdownContent content={contentHtmlWithIds} />
                </article>
            </div>
        </div>
    )
}
