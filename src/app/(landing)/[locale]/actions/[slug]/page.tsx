import { ActionTriggerView } from "@/components/ActionTriggerView"
import { ActionIcon } from "@/components/ActionIcon"
import { ActionCard } from "@/components/cards/ActionCard"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { LinkButton } from "@/components/ui/LinkButton"
import { getPageLocaleAndSlug, type LocaleSlugPageParams } from "@/lib/appRoute"
import { extractFlowTypesFromJson, extractFunctionDefinitionsFromJson, fetchMediaJson } from "@/lib/actionExtraction"
import { getActionBySlug, getLandingPage } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { createMetadata } from "@/lib/siteConfig"
import type { Media } from "@/payload-types"
import { IconArrowLeft } from "@tabler/icons-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function ActionDetailPage({ params }: { params: LocaleSlugPageParams }) {
    const { locale, slug } = await getPageLocaleAndSlug(params)
    const action = await getActionBySlug(slug, locale)
    if (!action) notFound()
    const actionsPage = await getLandingPage("actions", locale)

    const module = action.module as Media | undefined
    const moduleJson = await fetchMediaJson(module).catch(() => null)
    const extractedFlowTypes = extractFlowTypesFromJson(moduleJson)
    const extractedFunctionDefinitions = extractFunctionDefinitionsFromJson(moduleJson)
    const flowTypeItems = extractedFlowTypes.map((item) => ({
        item,
        icon: item.displayIcon,
    }))
    const functionDefinitionItems = extractedFunctionDefinitions.map((item) => ({
        item,
        icon: item.displayIcon ?? "tabler:IconFunction",
    }))
    const references = (action.references ?? []).filter((reference): reference is Exclude<typeof reference, number> => typeof reference !== "number")
    const tags = (action.tags ?? []).filter((tag): tag is string => Boolean(tag))
    const actionsBlock = findPageBlock(actionsPage, "actions")
    const referencesLabel = actionsBlock?.referencesLabel ?? (locale === "de" ? "Referenzen" : "References")
    const emptyDefinitionLabels = {
        flowTypes: actionsBlock?.noFlowTypesFoundLabel ?? (locale === "de" ? "Keine FlowTypes gefunden." : "No flow types found."),
        functionDefinitions: actionsBlock?.noFunctionDefinitionsFoundLabel ?? (locale === "de" ? "Keine FunctionDefinitions gefunden." : "No function definitions found."),
        both: actionsBlock?.noActionDefinitionsFoundLabel ?? (locale === "de" ? "Keine FlowTypes oder FunctionDefinitions gefunden." : "No flow types or function definitions found."),
    }

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                    <LinkButton href={`/${locale}/actions`} showArrow={false} className="border-0 hover:bg-white/10 pl-2.5 pr-4 py-1 rounded-xl hover:text-white after:hidden">
                        <IconArrowLeft size={16} />
                        {locale === "de" ? "Zurück" : "Back"}
                    </LinkButton>

                    <div className="flex flex-col gap-8">
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                                    {action.icon && (
                                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-light text-white">
                                            <ActionIcon icon={action.icon} size={40} />
                                        </div>
                                    )}

                                    <div className="flex flex-col min-w-0 flex-1 gap-2">
                                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{action.title}</h1>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag) => (
                                                    <span key={tag} className="rounded-full border border-white/10 bg-light px-3 py-1 text-xs text-secondary">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {action.description && <div className="max-w-3xl whitespace-pre-line text-sm leading-6 text-secondary">{action.description}</div>}

                            <ActionTriggerView locale={locale} flowTypes={flowTypeItems} functionDefinitions={functionDefinitionItems} emptyLabels={emptyDefinitionLabels} />

                            {references.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm tracking-wider text-tertiary">{referencesLabel}</p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {references.map((reference) => (
                                            <ActionCard key={reference.id} action={reference} locale={locale} />
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

export async function generateMetadata({ params }: { params: LocaleSlugPageParams }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!slug?.trim()) return createMetadata()
    if (locale !== "de" && locale !== "en") return createMetadata()

    const action = await getActionBySlug(slug, locale)
    if (!action) return createMetadata()

    return createMetadata({
        title: action.title,
        description: action.shortDescription ?? action.description ?? undefined,
    })
}
