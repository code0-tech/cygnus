"use server"

import config from "@/payload.config"
import { getPayload } from "payload"
import type { SerializedEditorState } from "lexical"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"

export interface BlogPostItem {
    id: number
    title: string
    slug: string
    author: number | { email: string }
    content: SerializedEditorState
    createdAt: string
}

export interface BlogListItem {
    id: number
    title: string
    slug: string
    author: number | { email: string }
    createdAt: string
}

export async function getBlogPostBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<BlogPostItem | null> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "blog",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 1,
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

export async function getBlogPosts(locale: AppLocale = DEFAULT_LOCALE): Promise<BlogListItem[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "blog",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 1,
        sort: "-createdAt",
        pagination: false,
    })

    return (result.docs as BlogListItem[]) ?? []
}

export async function getBlogSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "blog",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        limit: 1000,
    })

    return result.docs
        .map((post) => post.slug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
}
