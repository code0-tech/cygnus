"use client"

import { JobsCard } from "@/components/cards/JobsCard"
import type { JobItem } from "@/lib/cms"
import {
    Button,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    TextInput
} from "@code0-tech/pictor"
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { useMemo, useState } from "react"

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
        <div className={"w-full md:w-[50vw] mx-auto flex flex-col gap-8"}>
            <h1 className={"text-4xl font-semibold mb-8 text-center"}>{labels.heading}</h1>

            <div className="w-full flex flex-col gap-2 mb-2">
                <TextInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={labels.searchPlaceholder}
                    left={<IconSearch size={13} />}
                    clearable
                    className="w-full rounded-xl bg-white/10 border border-white/15 text-white/85"
                />

                <div className="w-full flex flex-col md:flex-row md:justify-between gap-2">
                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="group min-w-40 w-full!">
                                {selectedLocation}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                        {locations.map((location) => (
                            <MenuItem key={location} onClick={() => setSelectedLocation(location)}>
                                {location}
                            </MenuItem>
                        ))}
                        </MenuContent>
                    </Menu>

                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="min-w-40 w-full!">
                                {selectedType}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                        {jobTypes.map((type) => (
                            <MenuItem key={type} onClick={() => setSelectedType(type)}>
                                {type}
                            </MenuItem>
                        ))}
                        </MenuContent>
                    </Menu>

                    <Menu modal={false}>
                        <MenuTrigger asChild>
                            <Button className="min-w-40 w-full!">
                                {selectedCategory}
                                <IconChevronDown size={16} />
                            </Button>
                        </MenuTrigger>
                        <MenuContent className="w-(--radix-dropdown-menu-trigger-width)">
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
