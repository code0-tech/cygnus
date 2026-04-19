"use client"

import { BlogPostItem } from "@/lib/cms"
import { Media, TeamMember } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function FirstBlogCard({ locale, post }: { locale: string, post: BlogPostItem }) {
    const { trigger } = useWebHaptics()
    const heroImage = post.heroImage as Media

    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    return (
        <Link
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
            className="group block"
        >
            <Card
                variant="filled"
                className="glass-card-shell p-2!"
            >
                <div aria-hidden="true" className="glass-card-tint" />
                <div aria-hidden="true" className="glass-card-topline" />

                <div className="relative z-10 flex flex-col gap-4 md:gap-6">
                    {heroImage?.url ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/8 bg-primary/40">
                            <Image
                                src={heroImage.url}
                                alt={heroImage.alt ?? post.title}
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="object-cover transition-transform duration-700"
                                priority
                            />
                        </div>
                    ) : (
                        <div className="image-placeholder aspect-video w-full px-4 text-sm">
                            {locale === "de" ? "Kein Bild" : "No image"}
                        </div>
                    )}

                    <div className="px-1 pb-1">
                        <p className="text-xs text-white/50 mb-3">
                            {(post.author as TeamMember).name} - {publishedDate}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white/95 leading-tight">{post.title}</h2>
                        {post.shortDescription && (
                            <p className="text-base md:text-lg leading-7 text-white/75 mt-4 mb-2 line-clamp-3">
                                {post.shortDescription}
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
