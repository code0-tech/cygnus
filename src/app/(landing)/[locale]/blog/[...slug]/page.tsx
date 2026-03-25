import { BlogPost } from "@/components/blog/BlogPost"
import { BlogSkeleton } from "@/components/blog/BlogSkeleton"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n"
import { getBlogSlugs, getLandingPage, type CtaLayoutBlock } from "@/lib/cms"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Suspense } from "react"
import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"

export default async function Page({ params }: { params: Promise<{ locale: string, slug: string[] }> }) {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) notFound()

    const normalizedSlug = slug?.join("/")?.trim()
    if (!normalizedSlug) notFound()

    const page = await getLandingPage("main", locale)
    const layout = page?.layout ?? []
    const ctaBlock = layout.find((block): block is CtaLayoutBlock => block.blockType === "cta") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className={"w-full max-w-4xl mx-auto"}>
                    <Suspense fallback={<BlogSkeleton />}>
                        <BlogPost slug={normalizedSlug} locale={locale} />

                        <div className={"glass-card-shell mt-32 w-full overflow-hidden rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"}>
                            <div aria-hidden="true" className="glass-card-topline" />
                            <div className={"relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12"}>

                                <InteractiveGridPattern
                                    className="opacity-60 mask-[radial-gradient(600px_circle_at_center,white,transparent)] rounded-3xl"
                                    width={40}
                                    height={40}
                                    squares={[35, 15]}
                                />
                                <div className={"pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_50%_22%,rgba(191,90,242,0.18),transparent_34%),radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_20%)] md:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_20%_50%,rgba(191,90,242,0.14),transparent_38%),radial-gradient(circle_at_78%_48%,rgba(255,255,255,0.08),transparent_28%)]"} />

                                <div className={"relative z-20 flex w-full max-w-4xl flex-col items-center gap-8 text-center md:flex-row md:items-center md:text-left"}>
                                    <div className={"relative flex size-32 md:size-40 shrink-0 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_18px_46px_rgba(0,0,0,0.24)] backdrop-blur-md"}>
                                        <div className={"relative isolate flex items-center justify-center rounded-3xl ring ring-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"}>
                                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-primary via-primary to-[#2a1638]" />
                                            <Image src={"/code0_logo_white.png"} width={"120"} height={"120"} alt={"Code0 Logo"} className={"z-20"} />
                                        </div>
                                    </div>

                                    <div className={"z-20 flex max-w-2xl flex-col items-center text-center md:items-start md:text-left"}>
                                        <p className={"max-w-xl text-3xl font-semibold leading-tight text-white"}>
                                            {ctaBlock?.heading ?? "Contact us"}
                                        </p>
                                        <p className={"mb-4 max-w-xl text-base leading-7 text-white/70"}>
                                            {ctaBlock?.subheading ?? ""}
                                        </p>
                                        <HapticButtonLink
                                            href={"/contact"}
                                            locale={locale}
                                            variant="normal"
                                            className={"h-11 rounded-xl px-8! bg-white/88! text-primary! shadow-[0_12px_28px_rgba(255,255,255,0.12)] hover:bg-white!"}
                                        >
                                            Contact us
                                        </HapticButtonLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Suspense>
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
