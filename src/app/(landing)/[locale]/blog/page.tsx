import { BlogCard } from "@/components/cards/BlogCard"
import { FirstBlogCard } from "@/components/cards/FirstBlogCard"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getBlogPosts } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const posts = (await getBlogPosts(locale)).sort((left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    const [firstPost, ...remainingPosts] = posts

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="h-32" aria-hidden="true" />
                <div className="w-full md:w-[50vw] mx-auto flex flex-col gap-8">
                    <h1 className="hidden">Blog</h1>
                    {posts.length === 0 && <p className="text-white/60">No blog posts available.</p>}
                    {firstPost ? <FirstBlogCard post={firstPost} locale={locale} /> : null}
                    {remainingPosts.map((post) => <BlogCard key={post.id} post={post} locale={locale} />)}
                </div>
                <div className="h-32" aria-hidden="true" />
            </LandingContainer>
        </>
    )
}
