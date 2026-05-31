import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

export const generateMetadata = createLandingMetadata("privacy")

export default async function PrivacyPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const page = await getLandingPage("privacy", locale)
    if (!page) notFound()
    const markdownBlock = findPageBlock(page, "markdown")
    const contentHtml = markdownBlock
        ? convertLexicalToHTML({ data: markdownBlock.content, disableContainer: true })
        : ""

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="md:w-[50vw] mx-auto">
                    <MarkdownContent content={contentHtml} />
                </div>
            </LandingContainer>
        </>
    )
}
