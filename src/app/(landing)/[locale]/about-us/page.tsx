import { TeamMemberCard } from "@/components/cards/TeamMemberCard"
import { MarkdownContent } from "@/components/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { MarkdownLayoutBlock, getLandingPage, getTeamMembers } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

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
            <LandingContainer>
                <div className="md:w-[50vw] mx-auto py-[20vh]">
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
