"use client"

import {useEffect, type ComponentType, useState} from "react"
import {BlogSkeleton} from "@/components/BlogSkeleton"

export function BlogPost({ slug }: { slug: string }) {
    const [Post, setPost] = useState<ComponentType | null>(null)

    useEffect(() => {
        import(`@/content/${slug}.mdx`).then((mod) => {
            setPost(() => mod.default)
        })
    }, [slug])

    if (!Post) return <BlogSkeleton/>
    return <Post />
}
