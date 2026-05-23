import { TeamMemberCard } from "@/components/cards/TeamMemberCard"
import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage, getTeamMembers } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"

export const generateMetadata = createLandingMetadata("about-us")

export default async function AboutPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const aboutUsPage = await getLandingPage("about-us", locale)
    const teamMembers = await getTeamMembers(locale)
    const markdownBlock = findPageBlock(aboutUsPage, "markdown")
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
