"use client"

import { BlogListItem } from "@/lib/cms"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function BlogCard({ locale, post }: { locale: string, post: BlogListItem }) {
    const { trigger } = useWebHaptics()

    const author = typeof post.author === "object" && post.author !== null ? post.author.name : "Unknown author"
    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    return (
        <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
        >
            <p className="text-xs text-white/50 mb-1">{author} - {publishedDate}</p>
            <h2 className="text-xl text-white/90">{post.title}</h2>
        </Link>
    )
}
