import { ContactForm } from "@/components/forms/ContactForm"
import { MarkdownContent } from "@/components/MarkdownContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage, type ContactLayoutBlock, type MarkdownLayoutBlock } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const page = await getLandingPage("contact", locale)
    if (!page) notFound()

    const markdownBlock = page.layout?.find((block): block is MarkdownLayoutBlock => block.blockType === "markdown") ?? null
    const contactBlock = page.layout?.find((block): block is ContactLayoutBlock => block.blockType === "contact") ?? null
    const contentHtml = markdownBlock
        ? convertLexicalToHTML({ data: markdownBlock.content, disableContainer: true })
        : ""

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="w-full md:w-[50vw] mx-auto py-[20vh]">
                    <MarkdownContent content={contentHtml} />
                    <div className="mt-10">
                        <ContactForm content={contactBlock} locale={locale} />
                    </div>
                </div>
            </LandingContainer>
        </>
    )
}
