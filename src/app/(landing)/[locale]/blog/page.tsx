import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getBlogPosts } from "@/utils/getBlogPostBySlug"
import { isSupportedLocale } from "@/utils/i18n"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const posts = await getBlogPosts(locale)

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className="md:w-[50vw] mx-auto flex flex-col gap-4">
                    <h1 className="text-4xl font-semibold mb-4">Blog</h1>

                    {posts.length === 0 && (
                        <p className="text-white/60">No blog posts available.</p>
                    )}

                    {posts.map((post) => {
                        const author = typeof post.author === "object" && post.author !== null ? post.author.email : "Unknown author"
                        const publishedDate = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
                            dateStyle: "long",
                        }).format(new Date(post.createdAt))

                        return (
                            <Link
                                key={post.id}
                                href={`/${locale}/blog/${post.slug}`}
                                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                            >
                                <p className="text-xs text-white/50 mb-1">{author} · {publishedDate}</p>
                                <h2 className="text-xl text-white/90">{post.title}</h2>
                            </Link>
                        )
                    })}
                </div>
            </LandingContainer>
        </>
    )
}

