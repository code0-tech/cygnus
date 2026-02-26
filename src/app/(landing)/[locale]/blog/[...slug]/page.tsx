import { BlogPost } from "@/components/blog/BlogPost"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/utils/i18n"
import { getBlogSlugs } from "@/utils/getBlogPostBySlug"
import { notFound } from "next/navigation"

export default async function Page({ params }: { params: Promise<{ locale: string, slug: string[] }> }) {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) notFound()
    const normalizedSlug = slug?.join("/")?.trim()
    if (!normalizedSlug) notFound()

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto"}>
                    <BlogPost slug={normalizedSlug} locale={locale} />
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateStaticParams() {
    const all = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => {
            const slugs = await getBlogSlugs(locale)
            return slugs.map((slug) => ({ locale, slug: slug.split("/").filter(Boolean) }))
        })
    )
    return all.flat()
}

export const dynamicParams = false
