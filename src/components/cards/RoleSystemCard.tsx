import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { RoleSystemAnimation } from "../animations/RoleSystemAnimation"

interface RoleSystemCardProps {
    locale: AppLocale
}

export async function RoleSystemCard({ locale }: RoleSystemCardProps) {
    const content = await getFeatureBySlug("role-system", locale)

    const roles = [
        {
            name: "Owner",
            description: "Can manage",
            badges: ["everything"],
            updatedAt: "Updated 16 days ago",
        },
        {
            name: "Maintainer",
            description: "Can manage",
            badges: ["projects", "organization", "runtimes"],
            updatedAt: "Updated 16 days ago",
        },
        {
            name: "Member",
            description: "Can manage",
            badges: ["flows", "projects"],
            updatedAt: "Updated 16 days ago",
        },
        {
            name: "Test",
            description: "Can manage",
            badges: ["projects", "roles", "flows",],
            updatedAt: "Updated 4 days ago",
        },
    ]

    return (
        <FeatureCard
            className="col-span-1 md:col-span-3 row-span-2"
            contentClassName="w-full flex flex-col gap-8 md:flex-row md:items-center md:justify-between"
            tone="pink"
        >
            <div className="relative h-88 w-full overflow-hidden md:h-full md:w-2/3">
                <RoleSystemAnimation roles={roles} />
            </div>
            <div className="pointer-events-none absolute left-0 inset-y-0 hidden w-48 bg-linear-to-r from-primary via-primary/90 to-transparent md:block" />
            <div className="pointer-events-none absolute right-0 inset-y-0 hidden w-152 bg-linear-to-r from-transparent via-primary to-primary md:block" />
            <FeatureCardText content={content} className="w-full md:w-1/3" />
        </FeatureCard>
    )
}
