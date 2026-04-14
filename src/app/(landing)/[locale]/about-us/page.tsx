import { TeamMemberCard } from "@/components/cards/TeamMemberCard"
import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { MarkdownLayoutBlock, getLandingPage, getTeamMembers } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("about-us", locale)
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const aboutUsPage = await getLandingPage("about-us", locale)
    const teamMembers = await getTeamMembers(locale)
    const markdownBlock = aboutUsPage?.layout?.find((block): block is MarkdownLayoutBlock => block.blockType === "markdown") ?? null
    const contentHtml = markdownBlock
        ? convertLexicalToHTML({ data: markdownBlock.content, disableContainer: true })
        : ""

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="md:w-[50vw] mx-auto">
                    <div className={"w-full md:w-[50vw] mx-auto flex flex-col gap-8"}>
                        <MarkdownContent content={contentHtml} />
                        <p className="text-3xl -mb-4">Team</p>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-2">
                            {teamMembers.map((member) => (
                                <TeamMemberCard key={member.id} member={member} locale={locale} />
                            ))}
                        </div>
                    </div>
                </div>
            </LandingContainer>
        </>
    )
}
