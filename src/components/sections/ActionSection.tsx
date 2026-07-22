"use client"

import { ActionCard } from "@/components/cards/ActionCard"
import type { ActionItem } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { TextInput } from "@code0-tech/pictor"
import { IconSearch } from "@tabler/icons-react"
import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"

interface ActionSectionContent {
    heading: string
    description: string
    searchPlaceholder: string
    noActionsFoundLabel: string
    referencesLabel: string
}

interface ActionSectionProps {
    actions: ActionItem[]
    locale: string
    content?: Partial<ActionSectionContent> | null
}

const defaultContent: ActionSectionContent = {
    heading: "Actions",
    description: "Browse available actions and integrations.",
    searchPlaceholder: "Search actions",
    noActionsFoundLabel: "No actions found for your search.",
    referencesLabel: "References",
}

export function ActionSection({ actions, locale, content }: ActionSectionProps) {
    const labels = { ...defaultContent, ...content }
    const [search, setSearch] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const tags = useMemo(() => {
        return Array.from(new Set(actions.flatMap((action) => action.tags?.filter((tag): tag is string => Boolean(tag?.trim())).map((tag) => tag.trim()) ?? []))).sort((a, b) => a.localeCompare(b))
    }, [actions])

    const filteredActions = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        return actions.filter((action) => {
            const item = [action.title, action.shortDescription, action.description, ...(action.tags ?? [])]
                .filter((value) => Boolean(value))
                .join(" ")
                .toLowerCase()
            const matchesSearch = !searchTerm || item.includes(searchTerm)
            const matchesTags = selectedTags.length === 0 || selectedTags.some((selectedTag) => action.tags?.includes(selectedTag))

            return matchesSearch && matchesTags
        })
    }, [actions, search, selectedTags])

    const toggleTag = (tag: string) => {
        setSelectedTags((currentTags) => (currentTags.includes(tag) ? currentTags.filter((currentTag) => currentTag !== tag) : [...currentTags, tag]))
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-white">{labels.heading}</h1>
                <p className="max-w-2xl text-sm leading-6 text-secondary">{labels.description}</p>
            </div>
            <TextInput
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
                placeholder={labels.searchPlaceholder}
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
                                onClick={() => toggleTag(tag)}
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
            <div className="flex flex-col gap-4">
                {filteredActions.map((action) => (
                    <ActionCard key={action.id} action={action} locale={locale} />
                ))}
            </div>
            {filteredActions.length === 0 && <p className="text-center text-sm text-tertiary">{labels.noActionsFoundLabel}</p>}
        </div>
    )
}
