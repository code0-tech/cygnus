import { ContactPageContent } from "@/components/ContactPageContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage, type ContactLayoutBlock } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("contact", locale)
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const page = await getLandingPage("contact", locale)
    if (!page) notFound()

    const contactBlock = page.layout?.find((block): block is ContactLayoutBlock => block.blockType === "contact") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="mx-auto w-full max-w-5xl">
                    <ContactPageContent locale={locale} contactBlock={contactBlock} />
                </div>
            </LandingContainer>
        </>
    )
}
