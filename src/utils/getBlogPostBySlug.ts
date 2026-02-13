"use server"

import config from "@/payload.config"
import { getPayload } from "payload"
import type { SerializedEditorState } from "lexical"

export interface BlogPostItem {
    id: number
    title: string
    slug: string
    content: SerializedEditorState
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostItem | null> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "blog",
        where: {
            slug: {
                equals: slug,
            },
        },
        limit: 1,
        pagination: false,
    })

    return (result.docs[0] as BlogPostItem | undefined) ?? null
}

export async function getBlogSlugs(): Promise<string[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "blog",
        pagination: false,
        limit: 1000,
    })

    return result.docs
        .map((post) => post.slug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
}
