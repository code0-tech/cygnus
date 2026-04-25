import { ActionTriggerView } from "@/components/ActionTriggerView"
import { ActionCard } from "@/components/cards/ActionCard"
import { Aurora } from "@/components/ui/Aurora"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { LinkButton } from "@/components/ui/LinkButton"
import { getActionBySlug, getActionSlugs, getLandingPage, type ActionsLayoutBlock } from "@/lib/cms"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n"
import { createMetadata } from "@/lib/siteConfig"
import type { Media } from "@/payload-types"
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

export default async function ActionDetailPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) notFound()
    if (!slug?.trim()) notFound()

    const action = await getActionBySlug(slug, locale)
    if (!action) notFound()
    const actionsPage = await getLandingPage("actions", locale)

    const icon = action.icon as Media | undefined
    const triggers = action.trigger as Media | undefined
    const functionDefs = action.functiondefinitions as Media | undefined
    const references = (action.references ?? []).filter((reference): reference is Exclude<typeof reference, number> => typeof reference !== "number")
    const tags = (action.tags ?? []).filter((tag): tag is string => Boolean(tag))
    const actionsBlock = actionsPage?.layout?.find((block): block is ActionsLayoutBlock => block.blockType === "actions") ?? null
    const referencesLabel = actionsBlock?.referencesLabel ?? (locale === "de" ? "Referenzen" : "References")

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                    <LinkButton
                        href={`/${locale}/actions`}
                        showArrow={false}
                        className="border-0 hover:bg-white/10 pl-2.5 pr-4 py-1 rounded-xl hover:text-white"
                    >
                        <IconArrowLeft size={16} />
                        {locale === "de" ? "Zurück" : "Back"}
                    </LinkButton>

                    <div className="flex flex-col gap-8">

                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">

                                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                                    {icon?.url && (
                                        <div className="relative size-20 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                                            <Image
                                                src={icon.url}
                                                alt={icon.alt ?? action.title}
                                                fill
                                                sizes="80px"
                                                className="object-contain p-2"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col min-w-0 flex-1 gap-2">
                                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{action.title}</h1>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {action.documentation?.label && action.documentation?.url && (
                                    <HapticButtonLink
                                        href={ action.documentation.url}
                                        variant="normal"
                                        className="text-sm!"
                                    >
                                        <IconExternalLink size={16}/>
                                        {action.documentation.label}
                                    </HapticButtonLink>
                                )}

                            </div>
                            {action.description && (
                                <div className="max-w-3xl whitespace-pre-line text-sm leading-6 text-white/75">
                                    {action.description}
                                </div>
                            )}

                            <ActionTriggerView locale={locale} triggers={triggers} functionDefs={functionDefs} />

                            {references.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm tracking-wider text-white/50">
                                        {referencesLabel}
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {references.map((reference) => (
                                            <ActionCard
                                                key={reference.id}
                                                action={reference}
                                                locale={locale}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) return createMetadata()
    if (!slug?.trim()) return createMetadata()

    const action = await getActionBySlug(slug, locale)
    if (!action) return createMetadata()

    return createMetadata({
        title: action.title,
        description: action.shortDescription ?? action.description ?? undefined,
    })
}

export async function generateStaticParams() {
    const all = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => {
            const slugs = await getActionSlugs(locale)
            return slugs.map((slug) => ({ locale, slug }))
        })
    )

    return all.flat()
}

export const dynamicParams = false
