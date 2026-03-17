import { AboutUsPageClient } from "@/components/pages/AboutUsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { MarkdownLayoutBlock, getLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const aboutUsPage = await getLandingPage("about-us", locale)
    const markdownBlock = aboutUsPage?.layout?.find((block): block is MarkdownLayoutBlock => block.blockType === "markdown") ?? null
    const contentHtml = markdownBlock
        ? convertLexicalToHTML({ data: markdownBlock.content, disableContainer: true })
        : ""

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="md:w-[50vw] mx-auto py-[20vh]">
                    <AboutUsPageClient content={contentHtml} locale={locale} />
                </div>
            </LandingContainer>
        </>
    )
}
