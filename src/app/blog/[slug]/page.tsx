export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    const { default: Post } = await import(`@content/${slug}.mdx`)

    return (
        <div>
            <Post/>
        </div>
    )
}

export function generateStaticParams() {
    return [{ slug: '1' }, { slug: '2' }]
}

export const dynamicParams = false