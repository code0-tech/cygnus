import { Card } from "@/components/ui/Card"
import { Section } from "@/components/ui/Section"
import { formatLongDate } from "@/lib/formatters"
import { getBlogPostBySlug, type BlogPreviewLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

interface BlogPreviewSectionProps {
    content?: BlogPreviewLayoutBlock | null
    locale?: AppLocale
}

function PreviewFrame({ children, showBorder }: { children: ReactNode; showBorder: boolean }) {
    if (!showBorder) return children

    return (
        <Card size="lg" variant="light" className="p-2!">
            {children}
        </Card>
    )
}

export async function BlogPreviewSection({ content, locale = "en" }: BlogPreviewSectionProps) {
    const referencedPost = content?.blog && typeof content.blog === "object" ? content.blog : null

    if (!content || !referencedPost) return null

    const post = typeof referencedPost.heroImage === "number" ? ((await getBlogPostBySlug(referencedPost.slug, locale)) ?? referencedPost) : referencedPost

    const heroImage = post.heroImage && typeof post.heroImage === "object" ? (post.heroImage as Media) : null
    const heroImageUrl = getMediaUrl(heroImage?.url)
    const authorName = post.author && typeof post.author === "object" ? post.author.name : null
    const publishedDate = formatLongDate(new Date(post.createdAt), locale)
    const isImageCenter = content.sectionLayout === "imageCenter"
    const isImageRight = content.sectionLayout === "imageRight"
    const postHref = `/${locale}/blog/${post.slug}`

    return (
        <Section heading={content.sectionHeading} description={content.sectionDescription} funnelType="center" animation={{ preset: "none" }}>
            <Link href={postHref} className={cn("group block", isImageCenter && "mx-auto w-full max-w-5xl")}>
                <PreviewFrame showBorder={content.showBorder ?? false}>
                    <article className={cn("relative z-10 overflow-hidden", isImageCenter ? "flex flex-col" : "grid min-h-96 lg:grid-cols-2")}>
                        <div className={cn("relative overflow-hidden bg-primary/40", isImageCenter ? "aspect-video" : "min-h-64 lg:min-h-96", isImageRight && "lg:order-2")}>
                            {heroImageUrl ? (
                                <Image
                                    src={heroImageUrl}
                                    alt={heroImage?.alt ?? post.title}
                                    fill
                                    sizes={isImageCenter ? "(min-width: 1024px) 960px, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
                                    className="object-cover border border-white/5 rounded-2xl"
                                />
                            ) : (
                                <div className="image-placeholder h-full min-h-64 w-full px-4 text-sm">{locale === "de" ? "Kein Bild" : "No image"}</div>
                            )}
                        </div>

                        <div
                            className={cn(
                                "flex flex-col justify-center p-6 md:p-10",
                                isImageCenter && "px-0 md:px-0 pb-0 md:pb-0",
                                content.showBorder && isImageCenter && "px-2 md:px-2 pb-4 md:pb-4",
                                isImageRight && "lg:order-1"
                            )}
                        >
                            <p className="mb-3 text-xs text-tertiary">{[authorName, publishedDate].filter(Boolean).join(" · ")}</p>
                            <h3 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">{post.title}</h3>
                            {post.shortDescription && <p className="mt-4 max-w-2xl text-base leading-7 text-secondary md:text-lg">{post.shortDescription}</p>}
                        </div>
                    </article>
                </PreviewFrame>
            </Link>
        </Section>
    )
}
