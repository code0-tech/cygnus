import { MarkdownContent } from "@/components/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage, type MarkdownLayoutBlock } from "@/utils/getLandingPage"
import { isSupportedLocale } from "@/utils/i18n"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const page = await getLandingPage("privacy", locale)
    if (!page) notFound()
    const markdownBlock = page.layout?.find((block): block is MarkdownLayoutBlock => block.blockType === "markdown") ?? null
    const contentHtml = markdownBlock
        ? convertLexicalToHTML({ data: markdownBlock.content, disableContainer: true })
        : ""

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="md:w-[50vw] mx-auto py-[20vh]">
                    <MarkdownContent content={contentHtml} />
                </div>
            </LandingContainer>
        </>
    )
}
