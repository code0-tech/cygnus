import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { Button } from "@/components/ui/Button"
import { getJobBySlug, getJobSlugs } from "@/utils/getJobs"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"
import { MarkdownContent } from "@/components/MarkdownContent"

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const job = await getJobBySlug(slug)

    if (!job) notFound()

    const contentHtml = convertLexicalToHTML({
        data: job.content,
        disableContainer: true,
    })

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto"}>
                    <MarkdownContent content={contentHtml}/>
                    <div className="mt-10">
                        <Button variant="default">Apply now</Button>
                    </div>
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateStaticParams() {
    const slugs = await getJobSlugs()
    return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = false
