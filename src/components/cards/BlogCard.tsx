"use client"

import { BlogPostItem } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { Media, TeamMember } from "@/payload-types"
import Image from "next/image"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

export function BlogCard({ locale, post }: { locale: string; post: BlogPostItem }) {
    const { trigger } = useWebHaptics()
    const heroImage = post.heroImage as Media
    const heroImageUrl = getMediaUrl(heroImage?.url)

    const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "long",
    }).format(new Date(post.createdAt))

    return (
        <Link href={`/${locale}/blog/${post.slug}`} onClick={() => trigger("medium")} className="block h-full">
            <Card size="lg" variant={"light"} className="h-full p-2!">
                <div className="relative z-10 flex h-full flex-row items-stretch gap-4 md:flex-col">
                    {heroImageUrl ? (
                        <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-2xl bg-primary/40 md:w-full md:aspect-video">
                            <Image src={heroImageUrl} alt={heroImage.alt ?? post.title} fill sizes="(min-width: 768px) 50vw, 160px" className="object-cover" />
                        </div>
                    ) : (
                        <div className="image-placeholder w-40 aspect-video shrink-0 px-2 text-xs md:w-full md:aspect-video">{locale === "de" ? "Kein Bild" : "No image"}</div>
                    )}

                    <div className="min-w-0 flex-1 px-1 pb-1 md:flex md:flex-col md:justify-between">
                        <h2 className="line-clamp-2 text-lg font-medium leading-tight tracking-tight text-white sm:text-xl">{post.title}</h2>
                        {post.shortDescription ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75">{post.shortDescription}</p> : null}
                        <p className="mt-4 mb-2 truncate text-xs text-white/50">
                            {(post.author as TeamMember).name} - {publishedDate}
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
