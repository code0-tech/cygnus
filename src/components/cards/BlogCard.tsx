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

    return (
        <Link
            href={`/${locale}/blog/${post.slug}`}
            onClick={() => trigger("medium")}
        >
            <Card variant="filled" className="bg-white/10! hover:bg-white/15! transition-all! p-2!">
                <div className="flex items-start gap-4">
                    {heroImage?.url ? (
                        <div className="relative h-32 aspect-video shrink-0 overflow-hidden rounded-xl">
                            <Image
                                src={heroImage.url}
                                alt={heroImage.alt ?? post.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-32 aspect-video shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-xs text-white/50 text-center px-2">
                            {locale === "de" ? "Kein Bild" : "No image"}
                        </div>
                    )}

                    <div className="min-w-0 flex-1 h-32 py-2 flex flex-col justify-center overflow-hidden">
                        <p className="text-xs text-white/50 mb-1">{(post.author as User).name} - {publishedDate}</p>
                        <h2 className="text-xl text-white/90 line-clamp-2">{post.title}</h2>
                        {post.shortDescription ? <p className="text-sm text-white/65 mt-2 line-clamp-2">{post.shortDescription}</p> : null}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
