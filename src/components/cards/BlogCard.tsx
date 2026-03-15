"use client"

import { BlogPostItem } from "@/lib/cms"
import { Media, User } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function BlogCard({ locale, post }: { locale: string, post: BlogPostItem }) {
    const { trigger } = useWebHaptics()
    const heroImage = post.heroImage as Media

    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))
    const authorName = typeof post.author === "number" ? "" : (post.author as User).name

    return (
        <Link
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
            className="group block"
        >
            <Card
                variant="filled"
                className="relative overflow-hidden rounded-3xl! border! border-white/8! bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]! p-3! shadow-[0_18px_60px_rgba(0,0,0,0.35)]!"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
                <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-aqua/14 blur-3xl transition-transform duration-700 group-hover:scale-115" />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-aqua/14 via-blue/6 to-transparent opacity-90" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-position-[center_center] bg-size-[32px_32px] mask-[linear-gradient(180deg,rgba(0,0,0,0.75),transparent_92%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(8,10,20,0),rgba(8,10,20,0.58)_58%,rgba(8,10,20,0.9))]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />

                <div className="relative z-10 flex items-start gap-4">
                    {heroImage?.url ? (
                        <div className="relative h-32 aspect-video shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-primary/40">
                            <Image
                                src={heroImage.url}
                                alt={heroImage.alt ?? post.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                        </div>
                    ) : (
                        <div className="h-32 aspect-video shrink-0 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] flex items-center justify-center text-xs text-white/50 text-center px-2">
                            {locale === "de" ? "Kein Bild" : "No image"}
                        </div>
                    )}

                    <div className="min-w-0 flex-1 h-32 py-2 flex flex-col justify-center overflow-hidden">
                        <p className="text-xs text-white/50 mb-1">{authorName ? `${authorName} - ${publishedDate}` : publishedDate}</p>
                        <h2 className="text-xl font-semibold tracking-tight text-white/92 line-clamp-2">{post.title}</h2>
                        {post.shortDescription ? <p className="text-sm leading-6 text-white/70 mt-2 line-clamp-2">{post.shortDescription}</p> : null}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
