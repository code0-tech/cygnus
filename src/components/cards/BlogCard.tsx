"use client"

import { BlogPostItem } from "@/lib/cms"
import { formatLongDate } from "@/lib/formatters"
import { getMediaUrl } from "@/lib/media"
import { Media, TeamMember } from "@/payload-types"
import Image from "next/image"
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder"
import { PlaygroundThumbnail } from "@/components/blog/PlaygroundThumbnail"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function BlogCard({ locale, post }: { locale: string; post: BlogPostItem }) {
    const { trigger } = useWebHaptics()
    const heroImage = post.heroImage as Media
    const heroImageUrl = getMediaUrl(heroImage?.url)

    const publishedDate = formatLongDate(new Date(post.createdAt), locale)

    return (
        <Link href={`/${locale}/blog/${post.slug}`} onClick={() => trigger("medium")} className="group block h-full rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">
            <div className="h-full rounded-3xl bg-light p-2 shadow-[inset_0_1px_1px_#bfbfbf1a]">
                <div className="relative z-10 flex h-full flex-row items-stretch gap-4 md:flex-col">
                    {post.heroMediaType === "playground" && post.heroPlaygroundUrl ? (
                        <PlaygroundThumbnail title={post.title} url={post.heroPlaygroundUrl} className="aspect-video w-40 shrink-0 md:w-full" />
                    ) : heroImageUrl ? (
                        <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-2xl bg-primary/40 md:w-full md:aspect-video">
                            <Image src={heroImageUrl} alt={heroImage.alt ?? post.title} fill sizes="(min-width: 768px) 50vw, 160px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                        </div>
                    ) : (
                        <ImagePlaceholder iconSize={24} className="w-40 aspect-video shrink-0 md:w-full md:aspect-video" />
                    )}

                    <div className="min-w-0 flex-1 px-1 pb-1 md:flex md:flex-col md:justify-between">
                        <h2 className="line-clamp-2 text-lg font-medium leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-brand sm:text-xl">{post.title}</h2>
                        {post.shortDescription ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-secondary">{post.shortDescription}</p> : null}
                        <p className="mt-4 mb-2 truncate text-xs text-tertiary">
                            {(post.author as TeamMember).name} - {publishedDate}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}
