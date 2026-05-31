import { ContactPageContent } from "@/components/ContactPageContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { notFound } from "next/navigation"

export const generateMetadata = createLandingMetadata("contact")

export default async function ContactPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const page = await getLandingPage("contact", locale)
    if (!page) notFound()

    const contactBlock = findPageBlock(page, "contact")

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
