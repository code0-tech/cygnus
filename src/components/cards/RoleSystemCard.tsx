import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import { FeatureCardText } from "../FeatureCardText"
import { FeatureCard } from "./FeatureCard"
import { RoleSystemAnimation } from "../animations/RoleSystemAnimation"

interface RoleSystemCardProps {
    locale: AppLocale
    animationDelay?: number
}

const ROLES = [
    {
        id: "owner",
        name: "Owner",
        description: "Can manage",
        badges: ["everything"],
        updatedAt: "Updated 16 days ago",
    },
    {
        id: "maintainer",
        name: "Maintainer",
        description: "Can manage",
        badges: ["projects", "organization", "runtimes"],
        updatedAt: "Updated 16 days ago",
    },
    {
        id: "member",
        name: "Member",
        description: "Can manage",
        badges: ["flows", "projects"],
        updatedAt: "Updated 16 days ago",
    },
    {
        id: "test",
        name: "Test",
        description: "Can manage",
        badges: ["projects", "roles", "flows"],
        updatedAt: "Updated 4 days ago",
    },
]

export async function RoleSystemCard({ locale, animationDelay = 0 }: RoleSystemCardProps) {
    const content = await getFeatureBySlug("role-system", locale)

    return (
        <FeatureCard
            className="col-span-1 md:col-span-3 row-span-2"
            contentClassName="w-full justify-end pt-0.5! xl:flex-row xl:items-center xl:justify-between"
            tone="pink"
            animationDelay={animationDelay}
        >
            <div
                className="absolute inset-0 xl:inset-y-0 xl:left-0 xl:right-auto xl:w-2/3"
                style={{
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
                }}
            >
                <RoleSystemAnimation roles={ROLES} />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-primary via-primary/70 xl:via-none to-transparent" />
            <FeatureCardText content={content} className="relative z-20 w-full shrink-0 xl:ml-auto xl:w-1/3" />
        </FeatureCard>
    )
}
