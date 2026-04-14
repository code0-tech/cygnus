import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage, type MarkdownLayoutBlock } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("legal-notice", locale)
}

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const page = await getLandingPage("legal-notice", locale)
    if (!page) notFound()
    const markdownBlock = page.layout?.find((block): block is MarkdownLayoutBlock => block.blockType === "markdown") ?? null
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
