import {BlogPost} from "@/components/BlogPost"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    const { default: Post } = await import(`@/content/${slug}.mdx`)

    return <BlogPost Component={Post}/>
}

export function generateStaticParams() {
    return [{ slug: 'test' }]
}

export const dynamicParams = false