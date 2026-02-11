"use client"

import { Aurora } from "@/components/Aurora"
import { LandingContainer } from "@/components/LandingContainer"
import { useMemo, useState } from "react"
import {
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
} from "@code0-tech/pictor"
import { IconChevronDown } from "@tabler/icons-react"

const jobs = [
    {
        title: "Senior Software Engineer",
        category: "Software",
        type: "Full-time",
        company: "Tech Innovators Inc.",
        location: "Remote",
        description: "Join our dynamic team to build cutting-edge software solutions that revolutionize the industry. We are looking for a passionate Senior Software Engineer with expertise in full-stack development, cloud technologies, and a strong background in scalable applications. If you thrive in a fast-paced environment and are eager to make an impact, we want to hear from you!"
    },
    {
        title: "Backend Engineer",
        category: "Software",
        type: "Full-time",
        company: "Platform Dynamics",
        location: "Berlin, DE",
        description: "Design and maintain resilient backend services with a focus on API performance, observability, and clean architecture. You will work closely with product and infrastructure teams."
    },
    {
        title: "Frontend Engineer",
        category: "Software",
        type: "Full-time",
        company: "Nova Apps",
        location: "Remote",
        description: "Build polished user interfaces in React and Next.js, improve performance, and collaborate with design on reusable component systems for web products."
    },
    {
        title: "Product Manager",
        category: "Product",
        type: "Full-time",
        company: "Creative Solutions Ltd.",
        location: "New York, NY",
        description: "We are seeking a visionary Product Manager to lead the development of innovative products that meet customer needs. The ideal candidate will have experience in product lifecycle management, strong communication skills, and a proven track record of delivering successful products. If you are passionate about creating impactful solutions and driving product strategy, apply now!"
    },
    {
        title: "Technical Product Manager",
        category: "Product",
        type: "Full-time",
        company: "ScaleWorks",
        location: "London, UK",
        description: "Own roadmap delivery for developer-facing products and translate technical constraints into clear priorities. You will coordinate engineering, design, and GTM stakeholders."
    },
    {
        title: "UX/UI Designer",
        category: "UI/UX",
        type: "Contract",
        company: "Design Studio Co.",
        location: "San Francisco, CA",
        description: "Join our creative team as a UX/UI Designer and help us craft intuitive and visually stunning user experiences. We are looking for a designer with a strong portfolio, proficiency in design tools, and a deep understanding of user-centered design principles. If you are passionate about creating engaging digital experiences, we would love to see your work!"
    },
    {
        title: "Product Designer",
        category: "UI/UX",
        type: "Full-time",
        company: "Pixel Harbor",
        location: "Amsterdam, NL",
        description: "Create end-to-end product experiences from discovery to handoff. You will run user research, produce high-fidelity designs, and partner with engineering to ensure quality."
    },
    {
        title: "Marketing Manager",
        category: "Marketing",
        type: "Full-time",
        company: "Growth Forge",
        location: "New York, NY",
        description: "Lead multi-channel campaigns across social, content, and paid channels. You will define positioning, manage launch plans, and optimize conversion metrics."
    },
    {
        title: "Content Strategist",
        category: "Marketing",
        type: "Part-time",
        company: "Brandline Media",
        location: "Remote",
        description: "Plan and execute editorial calendars, long-form thought leadership, and SEO-focused content that supports product awareness and lead generation."
    },
    {
        title: "Sales Development Representative",
        category: "Sales",
        type: "Full-time",
        company: "Orbit Commerce",
        location: "Chicago, IL",
        description: "Identify and qualify leads, run outbound prospecting, and help build the top of funnel. You will collaborate with account executives and marketing."
    },
    {
        title: "Customer Success Manager",
        category: "Customer Success",
        type: "Full-time",
        company: "Supportly",
        location: "Remote",
        description: "Drive customer adoption and retention by guiding onboarding, monitoring account health, and acting as a strategic partner for key customers."
    }
]

export default function JobPage() {
    const [search, setSearch] = useState("")
    const [selectedLocation, setSelectedLocation] = useState("All locations")
    const [selectedType, setSelectedType] = useState("All job types")
    const [selectedCategory, setSelectedCategory] = useState("All categories")

    const locations = useMemo(
        () => ["All locations", ...Array.from(new Set(jobs.map((job) => job.location)))],
        []
    )
    const jobTypes = useMemo(
        () => ["All job types", ...Array.from(new Set(jobs.map((job) => job.type)))],
        []
    )
    const categories = useMemo(
        () => ["All categories", ...Array.from(new Set(jobs.map((job) => job.category)))],
        []
    )

    const filteredJobs = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        return jobs.filter((job) => {
            const matchesSearch =
                searchTerm.length === 0 ||
                `${job.title} ${job.company} ${job.location} ${job.description}`
                    .toLowerCase()
                    .includes(searchTerm)

            const matchesLocation =
                selectedLocation === "All locations" || job.location === selectedLocation

            const matchesType =
                selectedType === "All job types" || job.type === selectedType

            const matchesCategory =
                selectedCategory === "All categories" || job.category === selectedCategory

            return matchesSearch && matchesLocation && matchesType && matchesCategory
        })
    }, [search, selectedLocation, selectedType, selectedCategory])

    const groupedJobs = useMemo(() => {
        return filteredJobs.reduce<Record<string, typeof jobs>>((acc, job) => {
            if (!acc[job.category]) acc[job.category] = []
            acc[job.category].push(job)
            return acc
        }, {})
    }, [filteredJobs])

    return (
        <>
            <Aurora/>
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto flex flex-col gap-8"}>
                    <h1 className={"text-4xl font-semibold mb-8 text-center"}>Join Our Team</h1>

                    <div className="w-full flex flex-col gap-2 mb-2">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search jobs"
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
                            {items.map((job, index) => (
                                <div key={`${job.title}-${index}`} className={"bg-white/10 p-4 rounded-lg shadow-md"}>
                                    <h3 className={"text-2xl font-semibold mb-2"}>{job.title}</h3>
                                    <p className={"text-sm text-gray-400 mb-4"}>{job.company} - {job.location} - {job.type}</p>
                                    <p className={"text-white/75"}>{job.description}</p>
                                </div>
                            ))}
                        </div>
                    ))}

                    {filteredJobs.length === 0 && (
                        <p className="text-white/60 text-center">No jobs found for your filter.</p>
                    )}
                </div>
            </LandingContainer>
        </>
    )
}
