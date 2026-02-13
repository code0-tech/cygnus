import { Aurora } from "@/components/ui/Aurora"
import { BlogPost } from "@/components/blog/BlogPost"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getBlogSlugs } from "@/utils/getBlogPostBySlug"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    return (
        <>
            <Aurora/>
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto"}>
                    <BlogPost slug={slug}/>
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateStaticParams() {
    const slugs = await getBlogSlugs()
    console.log(slugs)
    return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = false
