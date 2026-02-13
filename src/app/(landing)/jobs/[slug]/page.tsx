import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { Button } from "@/components/ui/Button"
import { getJobBySlug, getJobSlugs } from "@/utils/getJobs"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

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
                    <div
                        className={[
                            "[&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:mb-8",
                            "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-4",
                            "[&_h3]:text-xl [&_h3]:my-2",
                            "[&_p]:text-white/75 [&_p]:mb-4",
                            "[&_li]:text-white/75 [&_li]:mb-2",
                            "[&_a]:text-indigo-400 [&_a]:hover:underline",
                        ].join(" ")}
                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
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
