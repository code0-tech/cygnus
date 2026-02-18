"use client"

import type { JobItem } from "@/utils/getJobs"
import { useMemo, useState } from "react"
import {
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
} from "@code0-tech/pictor"
import { IconChevronDown } from "@tabler/icons-react"
import { JobsCard } from "@/components/cards/JobsCard"

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
            const matchesSearch =
                searchTerm.length === 0 ||
                `${job.title} ${job.location} ${job.description}`
                .toLowerCase()
                .includes(searchTerm)

            const matchesLocation = selectedLocation === labels.allLocationsLabel || job.location === selectedLocation
            const matchesType = selectedType === labels.allJobTypesLabel || job.type === selectedType
            const matchesCategory = selectedCategory === labels.allCategoriesLabel || job.category === selectedCategory

            return matchesSearch && matchesLocation && matchesType && matchesCategory
        })
    }, [jobs, labels.allCategoriesLabel, labels.allJobTypesLabel, labels.allLocationsLabel, search, selectedCategory, selectedLocation, selectedType])

    const groupedJobs = useMemo(() => {
        return filteredJobs.reduce<Record<string, JobItem[]>>((acc, job) => {
            if (!acc[job.category]) acc[job.category] = []
            acc[job.category].push(job)
            return acc
        }, {})
    }, [filteredJobs])

    return (
        <div className={"md:w-[50vw] mx-auto flex flex-col gap-8"}>
            <h1 className={"text-4xl font-semibold mb-8 text-center"}>{labels.heading}</h1>

            <div className="w-full flex flex-col gap-2 mb-2">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={labels.searchPlaceholder}
                    className="w-full rounded-xl bg-white/10 border border-white/15 text-white/85 px-3 h-10"
                />

                <div className="w-full flex flex-col md:flex-row md:justify-between gap-2">
                    <Menu>
                        <MenuTrigger asChild>
                            <button
                                type="button"
                                className="h-10 min-w-40 w-full px-3 rounded-xl bg-white/10 border border-white/15 text-white/85 inline-flex items-center justify-between gap-2"
                            >
                                {selectedLocation}
                                <IconChevronDown size={16} />
                            </button>
                        </MenuTrigger>
                        <MenuContent>
                        {locations.map((location) => (
                            <MenuItem key={location} onClick={() => setSelectedLocation(location)}>
                                {location}
                            </MenuItem>
                        ))}
                        </MenuContent>
                    </Menu>

                    <Menu>
                        <MenuTrigger asChild>
                            <button
                                type="button"
                                className="h-10 min-w-40 w-full px-3 rounded-xl bg-white/10 border border-white/15 text-white/85 inline-flex items-center justify-between gap-2"
                            >
                                {selectedType}
                                <IconChevronDown size={16} />
                            </button>
                        </MenuTrigger>
                        <MenuContent>
                        {jobTypes.map((type) => (
                            <MenuItem key={type} onClick={() => setSelectedType(type)}>
                                {type}
                            </MenuItem>
                        ))}
                        </MenuContent>
                    </Menu>

                    <Menu>
                        <MenuTrigger asChild>
                            <button
                                type="button"
                                className="h-10 min-w-40 w-full px-3 rounded-xl bg-white/10 border border-white/15 text-white/85 inline-flex items-center justify-between gap-2"
                            >
                                {selectedCategory}
                                <IconChevronDown size={16} />
                            </button>
                        </MenuTrigger>
                        <MenuContent>
                        {categories.map((category) => (
                            <MenuItem key={category} onClick={() => setSelectedCategory(category)}>
                                {category}
                            </MenuItem>
                        ))}
                        </MenuContent>
                    </Menu>
                </div>
            </div>

            {Object.entries(groupedJobs).map(([category, items]) => (
                <div key={category} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 w-full">
                        <h2 className="text-md text-white/30">{category}</h2>
                        <div className="h-0.5 flex-1 bg-white/10 rounded-full" />
                    </div>
                    {items.map((job) => (
                        <JobsCard key={job.id} job={job} locale={locale} />
                    ))}
                </div>
            ))}

            {filteredJobs.length === 0 && (
                <p className="text-white/60 text-center">{labels.noJobsFoundLabel}</p>
            )}
        </div>
    )
}
