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

function BlogCardSkeleton() {
    return (
        <div className="glass-card-shell h-full p-2">
            <div aria-hidden="true" className="glass-card-topline" />
            <div className="relative z-10 flex h-full flex-row items-stretch gap-4 md:flex-col">
                <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-2xl bg-white/10 md:w-full md:aspect-video" />
                <div className="min-w-0 flex-1 px-1 pb-1 md:flex md:flex-col md:justify-between">
                    <div>
                        <div className="h-6 w-full rounded-full bg-white/10" />
                        <div className="mt-2 h-6 w-4/5 rounded-full bg-white/10" />
                        <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
                        <div className="mt-2 h-4 w-5/6 rounded-full bg-white/10" />
                        <div className="mt-2 h-4 w-2/3 rounded-full bg-white/10" />
                    </div>
                    <div className="mb-2 mt-4 h-4 w-3/4 rounded-full bg-white/10" />
                </div>
            </div>
        </div>
    )
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

            const response = await fetch(`/api/payload_blog?locale=${encodeURIComponent(locale)}&page=${nextPage}&limit=12`)

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
                        {isPending && Array.from({ length: 3 }).map((_, index) => (
                            <BlogCardSkeleton key={`loading-blog-${index}`} />
                        ))}
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
