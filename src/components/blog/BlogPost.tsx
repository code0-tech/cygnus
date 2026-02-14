import { getBlogPostBySlug } from "@/utils/getBlogPostBySlug"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"
import { MarkdownContent } from "../MarkdownContent"

export async function BlogPost({ slug }: { slug: string }) {
    const post = await getBlogPostBySlug(slug)

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
