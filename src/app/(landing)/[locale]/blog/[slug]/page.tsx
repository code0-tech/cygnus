import { BlogPost } from "@/components/blog/BlogPost"
import { BlogSkeleton } from "@/components/blog/BlogSkeleton"
import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { Aurora } from "@/components/ui/Aurora"
import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getPageLocaleAndSlug, type LocaleSlugPageParams } from "@/lib/appRoute"
import { getBlogPostBySlug, getLandingPage } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { createMetadata, resolveSiteUrl } from "@/lib/siteConfig"
import { type Media } from "@/payload-types"
import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"

function getMediaUrl(value?: number | Media | null) {
    if (!value || typeof value === "number" || !value.url) {
        return undefined
    }

    return new URL(value.url, resolveSiteUrl()).toString()
}

export default async function Page({ params }: { params: LocaleSlugPageParams }) {
    const { locale, slug } = await getPageLocaleAndSlug(params)
    const page = await getLandingPage("main", locale)
    const ctaBlock = findPageBlock(page, "cta")

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className={"pt-32 w-full max-w-5xl mx-auto"}>
                    <Suspense fallback={<BlogSkeleton />}>
                        <BlogPost slug={slug} locale={locale} />

                        <Card size="lg" className={"mt-32 w-full p-0 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"}>
                            <div className={"relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12"}>
                                <InteractiveGridPattern className="opacity-60 mask-[radial-gradient(600px_circle_at_center,white,transparent)] rounded-3xl" width={40} height={40} squares={[35, 15]} />
                                <div
                                    className={
                                        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_50%_22%,rgba(191,90,242,0.18),transparent_34%),radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_20%)] md:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_20%_50%,rgba(191,90,242,0.14),transparent_38%),radial-gradient(circle_at_78%_48%,rgba(255,255,255,0.08),transparent_28%)]"
                                    }
                                />

                                <div className={"relative z-20 flex w-full max-w-4xl flex-col items-center gap-8 text-center md:flex-row md:items-center md:text-left"}>
                                    <div className={"relative flex size-32 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/5 md:size-40"}>
                                        <div className={"relative isolate flex items-center justify-center rounded-3xl ring ring-white/10 px-4 py-4"}>
                                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-linear-to-br from-primary via-primary to-slate-900" />
                                            <Image src={"/code0_logo_white.png"} width={"120"} height={"120"} alt={"Code0 Logo"} className={"z-20"} />
                                        </div>
                                    </div>

                                    <div className={"z-20 flex max-w-2xl flex-col items-center text-center md:items-start md:text-left"}>
                                        <p className={"max-w-xl text-3xl font-semibold leading-tight text-white"}>{ctaBlock?.heading ?? "Contact us"}</p>
                                        <p className={"mb-4 max-w-xl text-base leading-7 text-white/70"}>{ctaBlock?.subheading ?? ""}</p>
                                        <HapticButtonLink href={"/contact"} variant="normal" className={"h-11 rounded-xl px-8! bg-white/90! text-primary! hover:bg-white!"}>
                                            Contact us
                                        </HapticButtonLink>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Suspense>
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateMetadata({ params }: { params: LocaleSlugPageParams }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!slug?.trim()) return createMetadata()
    if (locale !== "de" && locale !== "en") return createMetadata()

    const post = await getBlogPostBySlug(slug, locale)
    if (!post) return createMetadata()

    const title = post.meta?.title ?? post.title
    const description = post.meta?.description ?? post.shortDescription ?? undefined
    const canonicalPath = `/${locale}/blog/${post.slug}`
    const canonicalUrl = new URL(canonicalPath, resolveSiteUrl()).toString()
    const openGraphImage = getMediaUrl(post.meta?.image ?? post.heroImage)
    const twitterImage = openGraphImage

    return createMetadata({
        title,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "article",
            images: openGraphImage ? [openGraphImage] : undefined,
        },
        twitter: {
            title,
            description,
            images: twitterImage ? [twitterImage] : undefined,
        },
    })
}
