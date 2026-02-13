import { getBlogPostBySlug } from "@/utils/getBlogPostBySlug"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

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
            <div
                className={[
                    "[&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:mb-8",
                    "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-4",
                    "[&_h3]:text-xl [&_h3]:my-2",
                    "[&_p]:text-white/75 [&_p]:mb-4",
                    "[&_li]:text-white/75 [&_li]:mb-2",
                    "[&_a]:text-indigo-400 [&_a]:hover:underline",
                ].join(" ")}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            >
            </div>
        </article>
    )
}
