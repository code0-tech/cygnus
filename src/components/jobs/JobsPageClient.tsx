"use client"

import type { JobItem } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { Button, Menu, MenuContent, MenuItem, MenuTrigger, TextInput } from "@code0-tech/pictor"
import { IconChevronDown, IconChevronRight, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface JobsPageContent {
    heading: string
    searchPlaceholder: string
    allLocationsLabel: string
    allJobTypesLabel: string
    allCategoriesLabel: string
    noJobsFoundLabel: string
}

interface JobsPageClientProps {
    jobs: JobItem[]
    locale: string
    content?: Partial<JobsPageContent> | null
}

const defaultContent: JobsPageContent = {
    heading: "Join Our Team",
    searchPlaceholder: "Search jobs",
    allLocationsLabel: "All locations",
    allJobTypesLabel: "All job types",
    allCategoriesLabel: "All categories",
    noJobsFoundLabel: "No jobs found for your filter.",
}

const HOUSE_SURFACE = "bg-light shadow-[inset_0_1px_1px_#bfbfbf1a]"

export function JobsPageClient({ jobs, locale, content }: JobsPageClientProps) {
    const labels = { ...defaultContent, ...content }
    const [search, setSearch] = useState("")
    const [selectedLocation, setSelectedLocation] = useState(labels.allLocationsLabel)
    const [selectedType, setSelectedType] = useState(labels.allJobTypesLabel)
    const [selectedCategory, setSelectedCategory] = useState(labels.allCategoriesLabel)

    const locations = useMemo(() => [labels.allLocationsLabel, ...Array.from(new Set(jobs.map((job) => job.location)))], [jobs, labels.allLocationsLabel])
    const jobTypes = useMemo(() => [labels.allJobTypesLabel, ...Array.from(new Set(jobs.map((job) => job.type)))], [jobs, labels.allJobTypesLabel])
    const categories = useMemo(() => [labels.allCategoriesLabel, ...Array.from(new Set(jobs.map((job) => job.category)))], [jobs, labels.allCategoriesLabel])

    const filteredJobs = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        return jobs.filter((job) => {
            const matchesSearch = searchTerm.length === 0 || `${job.title} ${job.location} ${job.description}`.toLowerCase().includes(searchTerm)

            const matchesLocation = selectedLocation === labels.allLocationsLabel || job.location === selectedLocation
            const matchesType = selectedType === labels.allJobTypesLabel || job.type === selectedType
            const matchesCategory = selectedCategory === labels.allCategoriesLabel || job.category === selectedCategory

            return matchesSearch && matchesLocation && matchesType && matchesCategory
        })
    }, [jobs, labels.allCategoriesLabel, labels.allJobTypesLabel, labels.allLocationsLabel, search, selectedCategory, selectedLocation, selectedType])

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <h1 className="text-4xl font-semibold text-white">{labels.heading}</h1>

            <nav aria-label={labels.allCategoriesLabel} className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
                {categories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap capitalize transition-colors",
                            selectedCategory === category ? cn(HOUSE_SURFACE, "text-white") : "text-tertiary hover:bg-white/4 hover:text-white"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </nav>

            {/* Layout lives on our own wrappers: pictor's className lands on inner elements, not the outer box. */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                    <TextInput
                        value={search}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.currentTarget.value)}
                        placeholder={labels.searchPlaceholder}
                        left={<IconSearch size={13} />}
                        clearable
                        className="w-full! text-white!"
                    />
                </div>
                <div className="w-full shrink-0 sm:w-44">
                    <FilterMenu options={locations} selected={selectedLocation} onSelect={setSelectedLocation} />
                </div>
                <div className="w-full shrink-0 sm:w-44">
                    <FilterMenu options={jobTypes} selected={selectedType} onSelect={setSelectedType} />
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div className={cn("divide-y divide-white/5 overflow-hidden rounded-3xl", HOUSE_SURFACE)}>
                    {filteredJobs.map((job) => (
                        <JobRow key={job.id} job={job} locale={locale} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-white/10 py-16 text-center">
                    <IconSearch size={20} className="text-tertiary" />
                    <p className="text-sm text-tertiary">{labels.noJobsFoundLabel}</p>
                </div>
            )}
        </div>
    )
}

function FilterMenu({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (value: string) => void }) {
    return (
        <Menu modal={false}>
            <MenuTrigger asChild>
                <Button className="w-full! justify-between gap-2! capitalize">
                    {selected}
                    <IconChevronDown size={16} />
                </Button>
            </MenuTrigger>
            <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                {options.map((option) => (
                    <MenuItem key={option} onClick={() => onSelect(option)} className="capitalize">
                        {option}
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    )
}

function JobRow({ job, locale }: { job: JobItem; locale: string }) {
    const { trigger } = useWebHaptics()

    return (
        <Link
            href={`/${locale}/jobs/${job.slug}`}
            onClick={() => trigger("medium")}
            className="group grid grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-4 px-5 py-4 transition-colors hover:bg-white/2 md:grid-cols-[minmax(0,1fr)_9rem_9rem_1.5rem]"
        >
            <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-white">{job.title}</span>
                <span className="truncate text-xs text-tertiary capitalize md:hidden">
                    {job.location} · {job.type}
                </span>
                <span className="hidden truncate text-xs text-tertiary capitalize md:block">{job.category}</span>
            </div>
            <span className="hidden text-sm text-secondary capitalize md:block">{job.location}</span>
            <span className="hidden text-sm text-secondary capitalize md:block">{job.type}</span>
            <IconChevronRight size={18} className="text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </Link>
    )
}
