"use client"

import { ActionCard } from "@/components/cards/ActionCard"
import type { ActionItem } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { TextInput } from "@code0-tech/pictor"
import { IconSearch } from "@tabler/icons-react"
import { Section } from "@/components/ui/Section"
import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"

interface ActionListContent {
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    searchPlaceholder: string
    noActionsFoundLabel: string
}

type ActionTag = NonNullable<ActionItem["tags"]>[number]

export function ActionListSection({ actions, locale, content }: { actions: ActionItem[]; locale: string; content: ActionListContent }) {
    const [search, setSearch] = useState("")
    const [selectedTags, setSelectedTags] = useState<ActionTag[]>([])
    const tags = useMemo(
        () => Array.from(new Set(actions.flatMap((action) => action.tags ?? []))).sort((a, b) => a.localeCompare(b)),
        [actions]
    )
    const filteredActions = useMemo(() => {
        const term = search.trim().toLowerCase()
        return actions.filter((action) => {
            const searchable = [action.title, action.shortDescription, action.description, ...(action.tags ?? [])].filter(Boolean).join(" ").toLowerCase()
            const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => action.tags?.includes(tag))
            return (!term || searchable.includes(term)) && matchesTags
        })
    }, [actions, search, selectedTags])

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            funnelType={content.sectionLayout ?? "left"}
            linkButton={content.sectionLinkButton}
            className="mx-auto w-full gap-8"
            headingLevel={1}
        >
            <div className="flex flex-col gap-4">
                <TextInput
                    value={search}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.currentTarget.value)}
                    placeholder={content.searchPlaceholder}
                    left={<IconSearch size={12} />}
                    clearable
                    className="text-white!"
                />
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                            const selected = selectedTags.includes(tag)
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setSelectedTags((current) => (selected ? current.filter((item) => item !== tag) : [...current, tag]))}
                                    className={cn(
                                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                        selected ? "border-brand/40 bg-brand/15 text-brand" : "border-white/10 bg-white/3 text-tertiary hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    {tag}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredActions.map((action) => (
                    <ActionCard key={action.id} action={action} locale={locale} />
                ))}
            </div>
            {filteredActions.length === 0 && <p className="text-center text-sm text-tertiary">{content.noActionsFoundLabel}</p>}
        </Section>
    )
}
