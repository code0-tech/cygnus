import { BlogCard } from "@/components/cards/BlogCard"
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

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className="w-full md:w-[50vw] mx-auto flex flex-col gap-4">
                    <h1 className="hidden">Blog</h1>
                    {posts.length === 0 && <p className="text-white/60">No blog posts available.</p>}
                    {posts.map((post) => <BlogCard key={post.id} post={post} locale={locale} />)}
                </div>
            </LandingContainer>
        </>
    )
}
