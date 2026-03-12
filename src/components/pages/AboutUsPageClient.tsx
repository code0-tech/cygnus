import { MarkdownContent } from "@/components/MarkdownContent"
import { TeamMemberCard } from "@/components/cards/TeamMemberCard"
import { getTeamMembers } from "@/lib/cms"

interface AboutUsPageClientProps {
    locale: string
    content: string
}

export async function AboutUsPageClient({ locale, content }: AboutUsPageClientProps) {
    const teamMembers = await getTeamMembers()

    return (
        <div className={"w-full md:w-[50vw] mx-auto flex flex-col gap-8"}>
            <MarkdownContent content={content} />
            <p className="text-3xl -mb-4">Team</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-2">
                {teamMembers.map((member) => (
                    <TeamMemberCard key={member.id} member={member} locale={locale} />
                ))}
            </div>
        </div>
    )
}
