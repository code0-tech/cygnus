"use client"

import { ActionCard } from "@/components/cards/ActionCard"
import type { ActionItem } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { Button, Menu, MenuContent, MenuItem, MenuTrigger, TextInput } from "@code0-tech/pictor"
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { Section } from "@/components/ui/Section"
import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"

interface ActionListContent {
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    searchPlaceholder: string
    sortNewestLabel: string
    sortOldestLabel: string
    noActionsFoundLabel: string
    allCategoriesLabel?: string | null
    categoryLabels?: Partial<Record<CategoryLabelKey, string | null>> | null
}

type ActionTag = NonNullable<ActionItem["tags"]>[number]
type SortOrder = "newest" | "oldest"
type CategoryLabelKey =
    | "ai"
    | "analytics"
    | "communication"
    | "cybersecurity"
    | "dataStorage"
    | "developerTools"
    | "development"
    | "financeAccounting"
    | "hitl"
    | "marketing"
    | "miscellaneous"
    | "productivity"
    | "sales"
    | "utility"

const CATEGORY_LABEL_KEYS: Array<{ tag: ActionTag; label: CategoryLabelKey }> = [
    { tag: "AI", label: "ai" },
    { tag: "Analytics", label: "analytics" },
    { tag: "Communication", label: "communication" },
    { tag: "Cybersecurity", label: "cybersecurity" },
    { tag: "Data & Storage", label: "dataStorage" },
    { tag: "Developer Tools", label: "developerTools" },
    { tag: "Development", label: "development" },
    { tag: "Finance & Accounting", label: "financeAccounting" },
    { tag: "HITL", label: "hitl" },
    { tag: "Marketing", label: "marketing" },
    { tag: "Miscellaneous", label: "miscellaneous" },
    { tag: "Productivity", label: "productivity" },
    { tag: "Sales", label: "sales" },
    { tag: "Utility", label: "utility" },
]

export function ActionListSection({ actions, locale, content }: { actions: ActionItem[]; locale: string; content: ActionListContent }) {
    const [search, setSearch] = useState("")
    const [selectedTag, setSelectedTag] = useState<ActionTag | null>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
    const allCategoriesLabel = content.allCategoriesLabel || "All Categories"
    const selectedCategory = CATEGORY_LABEL_KEYS.find(({ tag }) => tag === selectedTag)
    const selectedCategoryLabel = selectedCategory ? content.categoryLabels?.[selectedCategory.label] || selectedCategory.tag : allCategoriesLabel
    const filteredActions = useMemo(() => {
        const term = search.trim().toLowerCase()
        return actions
            .filter((action) => {
                const searchable = [action.title, action.shortDescription, action.description, ...(action.tags ?? [])].filter(Boolean).join(" ").toLowerCase()
                const matchesTags = !selectedTag || action.tags?.includes(selectedTag)
                return (!term || searchable.includes(term)) && matchesTags
            })
            .toSorted((left, right) => {
                const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
                return sortOrder === "newest" ? difference : -difference
            })
    }, [actions, search, selectedTag, sortOrder])

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            funnelType={content.sectionLayout ?? "left"}
            linkButton={content.sectionLinkButton}
            className="mx-auto w-full gap-2 sm:gap-4 md:gap-8"
            headingLevel={1}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                        <TextInput
                            value={search}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.currentTarget.value)}
                            placeholder={content.searchPlaceholder}
                            left={<IconSearch size={12} />}
                            clearable
                            className="w-full! text-white!"
                        />
                    </div>
                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="w-full! justify-between sm:w-auto! sm:min-w-36">
                                {sortOrder === "newest" ? content.sortNewestLabel : content.sortOldestLabel}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                            <MenuItem onClick={() => setSortOrder("newest")}>{content.sortNewestLabel}</MenuItem>
                            <MenuItem onClick={() => setSortOrder("oldest")}>{content.sortOldestLabel}</MenuItem>
                        </MenuContent>
                    </Menu>
                </div>
            </div>
            <div className="grid items-start gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
                <div className="md:hidden">
                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="w-full! justify-between">
                                {selectedCategoryLabel}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                            <MenuItem onClick={() => setSelectedTag(null)}>{allCategoriesLabel}</MenuItem>
                            {CATEGORY_LABEL_KEYS.map(({ tag, label }) => (
                                <MenuItem key={tag} onClick={() => setSelectedTag(tag)}>
                                    {content.categoryLabels?.[label] || tag}
                                </MenuItem>
                            ))}
                        </MenuContent>
                    </Menu>
                </div>
                <nav aria-label={allCategoriesLabel} className="sticky top-24 hidden flex-col gap-1 md:flex">
                    <CategoryButton active={selectedTag === null} label={allCategoriesLabel} onClick={() => setSelectedTag(null)} />
                    {CATEGORY_LABEL_KEYS.map(({ tag, label }) => (
                        <CategoryButton key={tag} active={selectedTag === tag} label={content.categoryLabels?.[label] || tag} onClick={() => setSelectedTag(tag)} />
                    ))}
                </nav>
                <div className="min-w-0">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {filteredActions.map((action) => (
                            <ActionCard key={action.id} action={action} locale={locale} />
                        ))}
                    </div>
                    {filteredActions.length === 0 && <p className="py-8 text-center text-sm text-tertiary">{content.noActionsFoundLabel}</p>}
                </div>
            </div>
        </Section>
    )
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("shrink-0 rounded-xl px-3 py-2 text-left text-sm transition-colors", active ? "bg-light text-white" : "text-tertiary hover:bg-light hover:text-white")}
        >
            {label}
        </button>
    )
}
