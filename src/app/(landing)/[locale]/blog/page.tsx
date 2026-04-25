import { BlogBlock } from "@/blocks/BlogBlock"
import { BlogPageClient } from "@/components/blog/BlogPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { BlogLayoutBlock, getBlogPosts, getLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

const BLOG_PAGE_LABEL_FALLBACKS = {
    de: {
        viewOtherBlogsLabel: "Weitere Blogbeiträge",
        noPostsLabel: "Keine Blogbeiträge verfügbar.",
        loadMoreLabel: "Mehr laden",
        loadingLabel: "Laedt...",
    },
    en: {
        viewOtherBlogsLabel: "View other blog posts",
        noPostsLabel: "No blog posts available.",
        loadMoreLabel: "Load more",
        loadingLabel: "Loading...",
    },
} as const

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [posts, blogPage] = await Promise.all([
        getBlogPosts(locale, { page: 1, limit: 10 }),
        getLandingPage("blog", locale),
    ])

    const blogBlock = (blogPage?.layout ?? []).find((block): block is BlogLayoutBlock => block.blockType === "blog")

    const fallbackLabels = BLOG_PAGE_LABEL_FALLBACKS[locale]
    const viewOtherBlogsLabel = blogBlock?.viewOtherBlogsLabel?.trim() || fallbackLabels.viewOtherBlogsLabel
    const noPostsLabel = blogBlock?.noPostsLabel?.trim() || fallbackLabels.noPostsLabel
    const loadMoreLabel = blogBlock?.loadMoreLabel?.trim() || fallbackLabels.loadMoreLabel
    const loadingLabel = blogBlock?.loadingLabel?.trim() || fallbackLabels.loadingLabel

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="h-32" aria-hidden="true" />
                <BlogPageClient
                    heading={blogPage?.title?.trim() ?? "Blog"}
                    initialPosts={posts.posts}
                    initialHasNextPage={posts.hasNextPage}
                    initialNextPage={posts.nextPage}
                    locale={locale}
                    viewOtherBlogsLabel={viewOtherBlogsLabel}
                    noPostsLabel={noPostsLabel}
                    loadMoreLabel={loadMoreLabel}
                    loadingLabel={loadingLabel}
                />
                <div className="h-32" aria-hidden="true" />
            </LandingContainer>
        </>
    )
}
