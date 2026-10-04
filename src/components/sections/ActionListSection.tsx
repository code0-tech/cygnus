"use client"

import { ActionCard } from "@/components/actions/ActionCard"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { ActionSortOrder, ActionTag, PaginatedActionsResult } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { Button, Menu, MenuContent, MenuItem, MenuTrigger, TextInput } from "@code0-tech/pictor"
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { Section } from "@/components/ui/Section"
import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"

interface ActionListContent {
    sectionHeading?: string | null
    sectionLayout?: "center" | "left" | null
    sectionDescription?: string | null
    sectionLinkButton?: { label?: string | null; url?: string | null } | null
    searchPlaceholder: string
    sortNewestLabel: string
    sortOldestLabel: string
    loadMoreLabel: string
    noActionsFoundLabel: string
    allCategoriesLabel?: string | null
    categoryLabels?: Partial<Record<CategoryLabelKey, string | null>> | null
}

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

const ACTION_ROWS_PER_PAGE = 3
const ACTION_FETCH_LIMIT = 18

async function fetchActionPage({
    locale,
    page,
    search,
    tag,
    sortOrder,
    signal,
}: {
    locale: string
    page: number
    search: string
    tag: ActionTag | null
    sortOrder: ActionSortOrder
    signal?: AbortSignal
}): Promise<PaginatedActionsResult> {
    const searchParams = new URLSearchParams({ locale, page: String(page), limit: String(ACTION_FETCH_LIMIT), sort: sortOrder })
    if (search.trim()) searchParams.set("search", search.trim())
    if (tag) searchParams.set("tag", tag)

    const response = await fetch(`/api/payload_actions?${searchParams}`, { signal })
    if (!response.ok) throw new Error("Could not load actions.")
    return response.json() as Promise<PaginatedActionsResult>
}

export function ActionListSection({ initialResult, locale, content }: { initialResult: PaginatedActionsResult; locale: string; content: ActionListContent }) {
    const [search, setSearch] = useState("")
    const [selectedTag, setSelectedTag] = useState<ActionTag | null>(null)
    const [sortOrder, setSortOrder] = useState<ActionSortOrder>("newest")
    const [actions, setActions] = useState(initialResult.actions)
    const [hasNextPage, setHasNextPage] = useState(initialResult.hasNextPage)
    const [nextPage, setNextPage] = useState(initialResult.nextPage)
    const [isLoading, setIsLoading] = useState(false)
    const [visibleRows, setVisibleRows] = useState(ACTION_ROWS_PER_PAGE)
    const lastQueryKeyRef = useRef(`${locale}|||newest`)
    const isMediumScreen = useMediaQuery("(min-width: 768px)")
    const isLargeScreen = useMediaQuery("(min-width: 1024px)")
    const columnCount = isLargeScreen ? 6 : isMediumScreen ? 4 : 2
    const allCategoriesLabel = content.allCategoriesLabel || "All Categories"
    const selectedCategory = CATEGORY_LABEL_KEYS.find(({ tag }) => tag === selectedTag)
    const selectedCategoryLabel = selectedCategory ? content.categoryLabels?.[selectedCategory.label] || selectedCategory.tag : allCategoriesLabel
    const sortOptions: Array<{ value: ActionSortOrder; label: string }> = [
        { value: "newest", label: content.sortNewestLabel },
        { value: "oldest", label: content.sortOldestLabel },
    ]
    const selectedSortLabel = sortOptions.find(({ value }) => value === sortOrder)?.label ?? content.sortNewestLabel
    const currentQueryKey = `${locale}|${search.trim()}|${selectedTag ?? ""}|${sortOrder}`
    const latestQueryKeyRef = useRef(currentQueryKey)
    latestQueryKeyRef.current = currentQueryKey
    const visibleActions = actions.slice(0, visibleRows * columnCount)
    const hasMoreActions = visibleActions.length < actions.length || hasNextPage

    useEffect(() => {
        const queryKey = currentQueryKey
        if (queryKey === lastQueryKeyRef.current) return

        lastQueryKeyRef.current = queryKey
        const controller = new AbortController()
        const timeout = window.setTimeout(() => {
            setIsLoading(true)
            void fetchActionPage({ locale, page: 1, search, tag: selectedTag, sortOrder, signal: controller.signal })
                .then((result) => {
                    setActions(result.actions)
                    setHasNextPage(result.hasNextPage)
                    setNextPage(result.nextPage)
                })
                .catch((error) => {
                    if (error instanceof DOMException && error.name === "AbortError") return
                    console.error("Failed to filter actions:", error)
                })
                .finally(() => {
                    if (!controller.signal.aborted) setIsLoading(false)
                })
        }, 250)

        return () => {
            window.clearTimeout(timeout)
            controller.abort()
        }
    }, [currentQueryKey, locale, search, selectedTag, sortOrder])

    const resetRows = () => setVisibleRows(ACTION_ROWS_PER_PAGE)
    const selectTag = (tag: ActionTag | null) => {
        setSelectedTag(tag)
        resetRows()
    }
    const selectSortOrder = (value: ActionSortOrder) => {
        setSortOrder(value)
        resetRows()
    }
    const loadMore = async () => {
        if (isLoading) return

        const nextVisibleRows = visibleRows + ACTION_ROWS_PER_PAGE
        if (nextVisibleRows * columnCount <= actions.length || !hasNextPage || !nextPage) {
            setVisibleRows(nextVisibleRows)
            return
        }

        setIsLoading(true)
        const queryKey = currentQueryKey
        try {
            const result = await fetchActionPage({ locale, page: nextPage, search, tag: selectedTag, sortOrder })
            if (latestQueryKeyRef.current !== queryKey) return
            setActions((currentActions) => [...currentActions, ...result.actions])
            setHasNextPage(result.hasNextPage)
            setNextPage(result.nextPage)
            setVisibleRows(nextVisibleRows)
        } catch (error) {
            console.error("Failed to load more actions:", error)
        } finally {
            setIsLoading(false)
        }
    }

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
                <div className="flex flex-row gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <TextInput
                            value={search}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                setSearch(event.currentTarget.value)
                                resetRows()
                            }}
                            placeholder={content.searchPlaceholder}
                            left={<IconSearch size={12} />}
                            clearable
                            className="w-full! text-white!"
                        />
                    </div>
                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="w-36! shrink-0 justify-between gap-2!">
                                {selectedSortLabel}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent
                            align="end"
                            className="w-(--radix-dropdown-menu-trigger-width) [&_.scroll-area]:w-full! [&_.scroll-area__viewport>div]:block! [&_.scroll-area__viewport>div]:w-full! [&_.scroll-area__viewport>div>div]:w-full!"
                        >
                            {sortOptions.map(({ value, label }) => (
                                <MenuItem key={value} onClick={() => selectSortOrder(value)} className="w-full">
                                    {label}
                                </MenuItem>
                            ))}
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
                            <MenuItem onClick={() => selectTag(null)}>{allCategoriesLabel}</MenuItem>
                            {CATEGORY_LABEL_KEYS.map(({ tag, label }) => (
                                <MenuItem key={tag} onClick={() => selectTag(tag)}>
                                    {content.categoryLabels?.[label] || tag}
                                </MenuItem>
                            ))}
                        </MenuContent>
                    </Menu>
                </div>
                <nav aria-label={allCategoriesLabel} className="sticky top-24 hidden flex-col gap-1 md:flex">
                    <CategoryButton active={selectedTag === null} label={allCategoriesLabel} onClick={() => selectTag(null)} />
                    {CATEGORY_LABEL_KEYS.map(({ tag, label }) => (
                        <CategoryButton key={tag} active={selectedTag === tag} label={content.categoryLabels?.[label] || tag} onClick={() => selectTag(tag)} />
                    ))}
                </nav>
                <div className="min-w-0">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {visibleActions.map((action) => (
                            <ActionCard key={action.id} action={action} locale={locale} />
                        ))}
                    </div>
                    {hasMoreActions && (
                        <div className="mt-6 flex justify-center">
                            <Button type="button" variant="normal" disabled={isLoading} onClick={() => void loadMore()}>
                                {content.loadMoreLabel}
                            </Button>
                        </div>
                    )}
                    {!isLoading && actions.length === 0 && <p className="py-8 text-center text-sm text-tertiary">{content.noActionsFoundLabel}</p>}
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
