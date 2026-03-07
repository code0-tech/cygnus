"use client"

import { BlogListItem } from "@/lib/cms"
import { User } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function BlogCard({ locale, post }: { locale: string, post: BlogListItem }) {
    const { trigger } = useWebHaptics()

    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    return (
        <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
        >
            <Card variant="filled" className="bg-white/10! hover:bg-white/15! transition-all!">
                <p className="text-xs text-white/50 mb-1">{(post.author as User).name} - {publishedDate}</p>
                <h2 className="text-xl text-white/90">{post.title}</h2>
            </Card>
        </Link>
    )
}
