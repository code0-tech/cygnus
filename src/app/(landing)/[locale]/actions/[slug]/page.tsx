import { ActionIcon } from "@/components/ActionIcon"
import { ActionTriggerCard } from "@/components/ActionTriggerCard"
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
import type { ReactNode } from "react"

export default async function ActionDetailPage({ params }: { params: LocaleSlugPageParams }) {
    const { locale, slug } = await getPageLocaleAndSlug(params)
    const action = await getActionBySlug(slug, locale)
    if (!action) notFound()
    const actionsPage = await getLandingPage("actions", locale)

    const module = action.module as Media | undefined
    const moduleJson = await fetchMediaJson(module).catch(() => null)
    const extractedFlowTypes = extractFlowTypesFromJson(moduleJson)
    const extractedFunctionDefinitions = extractFunctionDefinitionsFromJson(moduleJson)
    const references = (action.references ?? []).filter((reference): reference is Exclude<typeof reference, number> => typeof reference !== "number")
    const tags = (action.tags ?? []).filter((tag): tag is string => Boolean(tag))
    const actionsBlock = findPageBlock(actionsPage, "actions")
    const referencesLabel = actionsBlock?.referencesLabel ?? (locale === "de" ? "Referenzen" : "References")
    const flowTypesLabel = actionsBlock?.flowTypesLabel ?? "FlowTypes"
    const functionDefinitionsLabel = actionsBlock?.functionDefinitionsLabel ?? "FunctionDefinitions"

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
                        <div className="relative z-10 flex flex-col gap-12">
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    {action.icon && (
                                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-primary text-white">
                                            <ActionIcon icon={action.icon} size={40} />
                                        </div>
                                    )}

                                    <div className="flex flex-col min-w-0 flex-1 gap-2">
                                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{action.title}</h1>
                                        {action.description && <div className="max-w-3xl whitespace-pre-line text-sm leading-6 text-secondary">{action.description}</div>}
                                    </div>
                                </div>
                            </div>

                            {(extractedFlowTypes.length > 0 || extractedFunctionDefinitions.length > 0) && (
                                <div className="space-y-8">
                                    {extractedFlowTypes.length > 0 && (
                                        <ActionDefinitionGroup label={flowTypesLabel}>
                                            {extractedFlowTypes.map((item) => (
                                                <ActionTriggerCard key={item.id} type="flowType" item={item} />
                                            ))}
                                        </ActionDefinitionGroup>
                                    )}

                                    {extractedFunctionDefinitions.length > 0 && (
                                        <ActionDefinitionGroup label={functionDefinitionsLabel}>
                                            {extractedFunctionDefinitions.map((item) => (
                                                <ActionTriggerCard key={item.id} type="functionDefinition" item={item} />
                                            ))}
                                        </ActionDefinitionGroup>
                                    )}
                                </div>
                            )}

                            {references.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-tertiary">{referencesLabel}</p>
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

function ActionDefinitionGroup({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-4">
            <p className="shrink-0 text-sm text-tertiary">{label}</p>
            <div className="flex flex-col gap-3">{children}</div>
        </div>
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
