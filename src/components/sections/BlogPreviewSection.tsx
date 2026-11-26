import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Section } from "@/components/ui/Section"
import { getBlogPostBySlug, type BlogPreviewLayoutBlock } from "@/lib/cms"
import { formatLongDate } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import Image from "next/image"
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder"
import { PlaygroundThumbnail } from "@/components/blog/PlaygroundThumbnail"
import Link from "next/link"
import type { ReactNode } from "react"
import { OffsetCardMotion } from "./client/OffsetCardMotion"

interface BlogPreviewSectionProps {
    content?: BlogPreviewLayoutBlock | null
    locale?: AppLocale
}

function PreviewFrame({ children, showBorder }: { children: ReactNode; showBorder: boolean }) {
    if (!showBorder) return children

    return <div className="rounded-3xl bg-light p-2 shadow-[inset_0_1px_1px_#bfbfbf1a]">{children}</div>
}

export async function BlogPreviewSection({ content, locale = "en" }: BlogPreviewSectionProps) {
    const referencedPost = content?.blog && typeof content.blog === "object" ? content.blog : null

    if (!content || !referencedPost) return null

    const post = typeof referencedPost.heroImage === "number" ? ((await getBlogPostBySlug(referencedPost.slug, locale)) ?? referencedPost) : referencedPost

    const heroImage = post.heroImage && typeof post.heroImage === "object" ? (post.heroImage as Media) : null
    const heroImageUrl = getMediaUrl(heroImage?.url)
    const authorName = post.author && typeof post.author === "object" ? post.author.name : null
    const publishedDate = formatLongDate(new Date(post.createdAt), locale)
    const showBorder = Boolean(content.showBorder)
    const isImageCenter = content.sectionLayout === "imageCenter"
    const isImageRight = content.sectionLayout === "imageRight"
    const isImageLeft = content.sectionLayout === "imageLeft"
    const motionPreset = isImageLeft ? "slide-right" : "slide-left"
    const postHref = `/${locale}/blog/${post.slug}`
    const contentSpacingClassName = isImageCenter
        ? showBorder
            ? "p-6 px-2 pb-4 md:p-10 md:px-2 md:pb-4"
            : "px-0 pb-0 md:px-0 md:pb-0"
        : showBorder
          ? "p-6 md:p-10"
          : cn(isImageRight && "pr-8", isImageLeft && "pl-8")

    return (
        <Section heading={content.sectionHeading} description={content.sectionDescription} funnelType="center" animation={{ preset: "none" }}>
            <OffsetCardMotion index={0} preset={motionPreset} className={cn(isImageCenter && "mx-auto w-full max-w-5xl")}>
                <Link href={postHref} className="group block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">
                    <PreviewFrame showBorder={showBorder}>
                        <article className={cn("relative z-10 overflow-hidden", isImageCenter ? "flex flex-col" : "grid min-h-96 lg:grid-cols-2")}>
                            <div className={cn("relative overflow-hidden rounded-2xl bg-primary/40", !showBorder && "border border-white/5", isImageCenter ? "aspect-video" : "min-h-64 lg:min-h-96", isImageRight && "lg:order-2")}>
                                {post.heroMediaType === "playground" && post.heroPlaygroundUrl ? (
                                    <PlaygroundThumbnail title={post.title} url={post.heroPlaygroundUrl} className="h-full w-full rounded-none" />
                                ) : heroImageUrl ? (
                                    <Image
                                        src={heroImageUrl}
                                        alt={heroImage?.alt ?? post.title}
                                        fill
                                        sizes={isImageCenter ? "(min-width: 1024px) 960px, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
                                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                    />
                                ) : (
                                    <ImagePlaceholder className="h-full min-h-64 w-full rounded-none border-0" />
                                )}
                            </div>

                            <StaggerContainer className={cn("flex flex-col justify-center", contentSpacingClassName, isImageRight && "lg:order-1")} delayChildren={0.06} staggerChildren={0.08}>
                                <StaggerItem as="p" y={14} duration={0.38} className="mb-3 text-xs text-tertiary">
                                    {[authorName, publishedDate].filter(Boolean).join(" \u00b7 ")}
                                </StaggerItem>
                                <StaggerItem as="h2" y={14} duration={0.38} className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-brand md:text-4xl">
                                    {post.title}
                                </StaggerItem>
                                {post.shortDescription && (
                                    <StaggerItem as="p" y={14} duration={0.38} className="mt-4 max-w-2xl text-base leading-7 text-secondary md:text-lg">
                                        {post.shortDescription}
                                    </StaggerItem>
                                )}
                            </StaggerContainer>
                        </article>
                    </PreviewFrame>
                </Link>
            </OffsetCardMotion>
        </Section>
    )
}
