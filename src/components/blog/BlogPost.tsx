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

    const contentHtml = convertLexicalToHTML({
        data: post.content,
        disableContainer: true,
    })

    return (
        <article>
            <h1 className={"text-4xl font-semibold mb-8"}>{post.title}</h1>
            <MarkdownContent content={contentHtml}/>
        </article>
    )
}
