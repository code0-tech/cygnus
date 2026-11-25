"use client"

import { ActionCard, ActionCardSkeleton } from "@/components/actions/ActionCard"
import type { ActionSortOrder, ActionTag, PaginatedActionsResult } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { Button, SegmentedControl, SegmentedControlItem, TextInput } from "@code0-tech/pictor"
import { IconSearch } from "@tabler/icons-react"
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

const PAGE_SIZE = 12
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
    const [totalDocs, setTotalDocs] = useState(initialResult.totalDocs)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    // Query key whose results are currently shown. Differs from the current key while a filter request is pending.
    const [settledQueryKey, setSettledQueryKey] = useState(`${locale}|||newest`)
    const lastQueryKeyRef = useRef(`${locale}|||newest`)

    const currentQueryKey = `${locale}|${search.trim()}|${selectedTag ?? ""}|${sortOrder}`
    const latestQueryKeyRef = useRef(currentQueryKey)
    latestQueryKeyRef.current = currentQueryKey

    const allCategoriesLabel = content.allCategoriesLabel || "All Categories"
    const categories = [
        { tag: null as ActionTag | null, label: allCategoriesLabel },
        ...CATEGORY_LABEL_KEYS.map(({ tag, label }) => ({ tag: tag as ActionTag | null, label: content.categoryLabels?.[label] || tag })),
    ]
    const selectedCategoryLabel = categories.find(({ tag }) => tag === selectedTag)?.label ?? allCategoriesLabel
    const sortOptions: Array<{ value: ActionSortOrder; label: string }> = [
        { value: "newest", label: content.sortNewestLabel },
        { value: "oldest", label: content.sortOldestLabel },
    ]
    const visibleActions = actions.slice(0, visibleCount)
    const hasMoreActions = visibleActions.length < actions.length || hasNextPage
    const isFiltering = currentQueryKey !== settledQueryKey
    const showSkeletons = isFiltering || isLoadingMore
    const isEmpty = !isFiltering && !isLoading && actions.length === 0

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
                    setTotalDocs(result.totalDocs)
                    setSettledQueryKey(queryKey)
                })
                .catch((error) => {
                    if (error instanceof DOMException && error.name === "AbortError") return
                    console.error("Failed to filter actions:", error)
                    setSettledQueryKey(queryKey)
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

    const resetVisible = () => setVisibleCount(PAGE_SIZE)
    const changeSearch = (value: string) => {
        setSearch(value)
        resetVisible()
    }
    const selectTag = (tag: ActionTag | null) => {
        setSelectedTag(tag)
        resetVisible()
    }
    const selectSortOrder = (value: ActionSortOrder) => {
        setSortOrder(value)
        resetVisible()
    }
    const loadMore = async () => {
        if (isLoading) return

        const nextVisibleCount = visibleCount + PAGE_SIZE
        if (nextVisibleCount <= actions.length || !hasNextPage || !nextPage) {
            setVisibleCount(nextVisibleCount)
            return
        }

        setIsLoading(true)
        setIsLoadingMore(true)
        const queryKey = currentQueryKey
        try {
            const result = await fetchActionPage({ locale, page: nextPage, search, tag: selectedTag, sortOrder })
            if (latestQueryKeyRef.current !== queryKey) return
            setActions((currentActions) => [...currentActions, ...result.actions])
            setHasNextPage(result.hasNextPage)
            setNextPage(result.nextPage)
            setVisibleCount(nextVisibleCount)
        } catch (error) {
            console.error("Failed to load more actions:", error)
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
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
            <div className="grid items-start gap-6 md:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
                <aside className="flex flex-col gap-3 md:sticky md:top-24">
                    <TextInput
                        value={search}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => changeSearch(event.currentTarget.value)}
                        placeholder={content.searchPlaceholder}
                        left={<IconSearch size={14} />}
                        clearable
                        className="w-full! text-white!"
                    />
                    <nav aria-label={allCategoriesLabel} className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-col md:overflow-visible md:px-0">
                        {categories.map(({ tag, label }) => (
                            <CategoryButton key={tag ?? "all"} label={label} active={selectedTag === tag} onClick={() => selectTag(tag)} />
                        ))}
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-col gap-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl font-bold tracking-tight text-white">{selectedCategoryLabel}</h2>
                            <p className={cn("text-sm tabular-nums text-tertiary", isLoading && "animate-pulse")}>
                                <span className="font-semibold text-white">{totalDocs}</span> Actions
                            </p>
                        </div>
                        {/* Styled like the payment period switch in CheckoutSummary. */}
                        <SegmentedControl
                            type="single"
                            color="secondary"
                            className="shrink-0"
                            value={sortOrder}
                            onValueChange={(value: string) => {
                                // Radix lets a single toggle group be deselected (value ""); keep the current order then.
                                const option = sortOptions.find((option) => option.value === value)
                                if (option) selectSortOrder(option.value)
                            }}
                        >
                            {sortOptions.map(({ value, label }) => (
                                <SegmentedControlItem key={value} value={value} className="px-3! py-2! text-xs! sm:text-sm!">
                                    <span className="text-white">{label}</span>
                                </SegmentedControlItem>
                            ))}
                        </SegmentedControl>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-busy={showSkeletons}>
                        {!isFiltering &&
                            visibleActions.map((action) => (
                                <ActionCard key={action.id} action={action} locale={locale} categoryLabel={action.tags?.[0] ? getCategoryLabel(action.tags[0], content) : null} />
                            ))}
                        {showSkeletons && Array.from({ length: PAGE_SIZE }, (_, index) => <ActionCardSkeleton key={`skeleton-${index}`} />)}
                    </div>

                    {isEmpty && (
                        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-white/10 py-16 text-center">
                            <IconSearch size={20} className="text-tertiary" />
                            <p className="text-sm text-tertiary">{content.noActionsFoundLabel}</p>
                        </div>
                    )}

                    {!isFiltering && hasMoreActions && (
                        <div className="mt-4 flex justify-center">
                            <Button type="button" variant="normal" disabled={isLoading} onClick={() => void loadMore()}>
                                {content.loadMoreLabel}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Section>
    )
}

function getCategoryLabel(tag: string, content: ActionListContent) {
    const entry = CATEGORY_LABEL_KEYS.find((item) => item.tag === tag)
    return (entry && content.categoryLabels?.[entry.label]) || tag
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "shrink-0 rounded-full px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors",
                active ? "bg-light text-white shadow-[inset_0_1px_1px_#bfbfbf1a]" : "text-tertiary hover:bg-white/4 hover:text-white"
            )}
        >
            {label}
        </button>
    )
}
