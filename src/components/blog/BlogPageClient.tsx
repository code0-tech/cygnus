"use client"

import { BlogCard } from "@/components/cards/BlogCard"
import { FirstBlogCard } from "@/components/cards/FirstBlogCard"
import type { BlogPostItem } from "@/lib/cms"
import { Button } from "@code0-tech/pictor"
import { useState, useTransition } from "react"

interface BlogPageClientProps {
    heading: string
    initialPosts: BlogPostItem[]
    initialHasNextPage: boolean
    initialNextPage: number | null
    locale: string
    viewOtherBlogsLabel: string
    noPostsLabel: string
    loadMoreLabel: string
    loadingLabel: string
}

function sortBlogPosts(posts: BlogPostItem[]): BlogPostItem[] {
    return [...posts].sort((left, right) => {
        const pinOrder = Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned))
        if (pinOrder !== 0) return pinOrder
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
}

export function BlogPageClient({
    heading,
    initialPosts,
    initialHasNextPage,
    initialNextPage,
    locale,
    viewOtherBlogsLabel,
    noPostsLabel,
    loadMoreLabel,
    loadingLabel,
}: BlogPageClientProps) {
    const [posts, setPosts] = useState(initialPosts)
    const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
    const [nextPage, setNextPage] = useState(initialNextPage)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const [firstPost, ...remainingPosts] = posts

    const handleLoadMore = () => {
        if (!nextPage || isPending) return

        startTransition(async () => {
            setError(null)

            const response = await fetch(`/api/blog?locale=${encodeURIComponent(locale)}&page=${nextPage}&limit=12`)

            if (!response.ok) {
                setError(locale === "de" ? "Weitere Blogbeiträge konnten nicht geladen werden." : "Failed to load more blog posts.")
                return
            }

            const data = await response.json() as {
                posts?: BlogPostItem[]
                hasNextPage?: boolean
                nextPage?: number | null
            }

            setPosts((current) => sortBlogPosts([...current, ...(data.posts ?? [])]))
            setHasNextPage(Boolean(data.hasNextPage))
            setNextPage(data.nextPage ?? null)
        })
    }

    return (
        <div className="flex flex-col gap-8">
            <h1 aria-hidden className="hidden">{heading}</h1>
            {posts.length === 0 && <p className="text-white/50">{noPostsLabel}</p>}
            {firstPost && (
                <>
                    <FirstBlogCard post={firstPost} locale={locale} />
                    <div aria-hidden className="h-16" />
                </>
            )}
            {remainingPosts.length > 0 && (
                <>
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-medium text-white/75">{viewOtherBlogsLabel}</h2>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {remainingPosts.map((post) => <BlogCard key={post.id} post={post} locale={locale} />)}
                    </div>
                </>
            )}
            {hasNextPage && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="normal"
                        onClick={handleLoadMore}
                        disabled={isPending}
                        className="min-w-40"
                    >
                        {isPending ? loadingLabel : loadMoreLabel}
                    </Button>
                </div>
            )}
            {error && <p className="text-center text-sm text-red-300">{error}</p>}
        </div>
    )
}
