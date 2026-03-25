"use client"

import { BlogPostItem } from "@/lib/cms"
import { Media, TeamMember } from "@/payload-types"
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

    return (
        <Link
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
            className="block"
        >
            <Card
                variant="filled"
                className="glass-card-shell p-3!"
            >
                <div aria-hidden="true" className="glass-card-tint" />
                <div aria-hidden="true" className="glass-card-topline" />

                <div className="relative z-10 flex items-start gap-4">
                    {heroImage?.url ? (
                        <div className="relative h-32 aspect-square lg:aspect-video shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-primary/40">
                            <Image
                                src={heroImage.url}
                                alt={heroImage.alt ?? post.title}
                                fill
                                sizes="(min-width: 1024px) 33vw, 128px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="image-placeholder h-32 aspect-square lg:aspect-video shrink-0 px-2 text-xs">
                            {locale === "de" ? "Kein Bild" : "No image"}
                        </div>
                    )}

                    <div className="min-w-0 flex-1 h-32 py-2 flex flex-col justify-center overflow-hidden">
                        <p className="text-xs text-white/50 mb-1">
                            {(post.author as TeamMember).name} - {publishedDate}
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight text-white/92 line-clamp-2">{post.title}</h2>
                        {post.shortDescription ? <p className="text-sm leading-6 text-white/70 mt-2 line-clamp-2">{post.shortDescription}</p> : null}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
