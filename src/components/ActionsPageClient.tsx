"use client"

import { ActionCard } from "@/components/cards/ActionCard"
import type { ActionItem } from "@/lib/cms"
import { TextInput } from "@code0-tech/pictor"
import { IconSearch } from "@tabler/icons-react"
import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"

interface ActionsPageContent {
    heading: string
    description: string
    searchPlaceholder: string
    noActionsFoundLabel: string
    referencesLabel: string
}

interface ActionsPageClientProps {
    actions: ActionItem[]
    locale: string
    content?: Partial<ActionsPageContent> | null
}

const defaultContent: ActionsPageContent = {
    heading: "Actions",
    description: "Browse available actions and integrations.",
    searchPlaceholder: "Search actions",
    noActionsFoundLabel: "No actions found for your search.",
    referencesLabel: "References",
}

export function ActionsPageClient({ actions, locale, content }: ActionsPageClientProps) {
    const labels = { ...defaultContent, ...content }
    const [search, setSearch] = useState("")

    const filteredActions = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()
        if (!searchTerm) return actions

        return actions.filter((action) => {
            const item = [action.title, action.shortDescription, action.description, ...(action.tags ?? [])]
                .filter((value) => Boolean(value))
                .join(" ")
                .toLowerCase()

            return item.includes(searchTerm)
        })
    }, [actions, search])

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-white">{labels.heading}</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/70">{labels.description}</p>
            </div>
            <TextInput
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
                placeholder={labels.searchPlaceholder}
                left={<IconSearch size={12} />}
                clearable
                className="text-white!"
            />
            <div className="grid gap-4 md:grid-cols-2">
                {filteredActions.map((action) => (
                    <ActionCard key={action.id} action={action} locale={locale} />
                ))}
            </div>
            {filteredActions.length === 0 && <p className="text-center text-sm text-white/60">{labels.noActionsFoundLabel}</p>}
        </div>
    )
}
