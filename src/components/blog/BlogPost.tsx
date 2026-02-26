import { getBlogPostBySlug } from "@/utils/getBlogPostBySlug"
import type { AppLocale } from "@/utils/i18n"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"
import { MarkdownContent } from "../MarkdownContent"

interface BlogPostProps {
    slug: string
    locale: AppLocale
}

export async function BlogPost({ slug, locale }: BlogPostProps) {
    const post = await getBlogPostBySlug(slug, locale)
    if (!post) notFound()

    const author = typeof post.author === "object" && post.author !== null ? post.author.email : "Unknown author"
    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    const contentHtml = convertLexicalToHTML({
        data: post.content,
        disableContainer: true,
    })

    return (
        <article>
            <h1 className={"text-4xl font-semibold mb-2"}>{post.title}</h1>
            <p className="text-sm text-white/60 mb-8">
                {author} · {publishedDate}
            </p>
            <MarkdownContent content={contentHtml}/>
        </article>
    )
}
