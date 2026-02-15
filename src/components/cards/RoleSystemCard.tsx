import { getFeatureBySlug } from "@/utils/getFeatures"
import { type AppLocale } from "@/utils/i18n"
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
            name: "Workspace Admin",
            scope: "Global",
            assign: "Team Orion",
        },
        {
            name: "Project Maintainer",
            scope: "Cygnus",
            assign: "Cygnus Platform",
        },
        {
            name: "Billing Viewer",
            scope: "Finance",
            assign: "Nova Billing",
        },
    ]

    return (
        <FeatureCard
            className="col-span-1 md:col-span-3 row-span-1"
            contentClassName="w-full flex flex-row items-center justify-between"
        >
            <div className="relative w-2/3 h-full overflow-hidden flex items-center -ml-4">
                <RoleSystemAnimation roles={roles} />
            </div>
            <div className="pointer-events-none absolute left-0 inset-y-0 w-48 bg-linear-to-r from-primary via-primary/70 to-transparent" />
            <div className="pointer-events-none absolute right-20 inset-y-0 w-96 bg-linear-to-r from-transparent via-primary to-transparent" />
            <FeatureCardText content={content} className="w-1/3"/>
        </FeatureCard>
    )
}
