"use client"

import { BlogPostItem } from "@/lib/cms"
import { formatLongDate } from "@/lib/formatters"
import { getMediaUrl } from "@/lib/media"
import { Media, TeamMember } from "@/payload-types"
import Image from "next/image"
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

export function FirstBlogCard({ locale, post }: { locale: string; post: BlogPostItem }) {
    const { trigger } = useWebHaptics()
    const heroImage = post.heroImage as Media
    const heroImageUrl = getMediaUrl(heroImage?.url)

    const publishedDate = formatLongDate(new Date(post.createdAt), locale)
    const postHref = `/${locale}/blog/${post.slug}`

    return (
        <div className="group block">
            <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-8">
                <div className="px-1 pb-1 xl:flex xl:w-2/5 xl:flex-col xl:justify-start">
                    <p className="text-xs text-tertiary mb-3">
                        {(post.author as TeamMember).name} - {publishedDate}
                    </p>
                    <Link href={postHref} onClick={() => trigger("medium")} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white text-balance leading-tight transition-colors duration-300 group-hover:text-brand">{post.title}</h2>
                    </Link>
                    {post.shortDescription && <p className="text-base text-balance md:text-lg leading-7 text-secondary mt-4 mb-2">{post.shortDescription}</p>}
                </div>

                <Card size="lg" className="w-full shrink-0 aspect-video p-2 xl:w-3/5">
                    <Link href={postHref} onClick={() => trigger("medium")} className="relative block h-full w-full overflow-hidden rounded-2xl bg-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">
                        {heroImageUrl ? (
                            <Image
                                src={heroImageUrl}
                                alt={heroImage.alt ?? post.title}
                                fill
                                sizes="(min-width: 768px) 45vw, 100vw"
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                priority
                            />
                        ) : (
                            <ImagePlaceholder className="aspect-video w-full" />
                        )}
                    </Link>
                </Card>
            </div>
        </div>
    )
}
