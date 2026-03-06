import { TeamMemberCard } from "@/components/cards/TeamMemberCard"
import { getTeamMembers } from "@/lib/cms"

interface AboutUsPageContent {
    title: string
    description: string
}

interface AboutUsPageClientProps {
    locale: string
    content?: Partial<AboutUsPageContent> | null
}

const defaultContent: AboutUsPageContent = {
    title: "About us",
    description: "Learn more about our team and who we are.",
}

export async function AboutUsPageClient({ locale, content }: AboutUsPageClientProps) {
    const labels = { ...defaultContent, ...content }
    const teamMembers = await getTeamMembers()

    return (
        <div className={"w-full md:w-[50vw] mx-auto flex flex-col gap-8"}>
            <h1 className={"text-4xl font-semibold mb-8 text-center"}>{labels.title}</h1>
            <p className="text-center text-white/75">{labels.description}</p>
            {teamMembers.length > 0 ? (
                <div className="flex flex-col gap-4 mt-2">
                    {teamMembers.map((member) => (
                        <TeamMemberCard key={member.id} member={member} locale={locale} />
                    ))}
                </div>
            ) : null}
        </div>
    )
}
