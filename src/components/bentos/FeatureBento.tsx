import { type AppLocale } from "@/lib/i18n"
import { BentoGrid } from "../ui/BentoGrid"
import { ProjectsCard } from "../cards/ProjectsCard"
import { RoleSystemCard } from "../cards/RoleSystemCard"
import { OrganizationCard } from "../cards/OrganizationCard"
import { MemberManagementCard } from "../cards/MemberManagementCard"

interface FeatureBentoProps {
    locale: AppLocale
}

export function FeatureBento({ locale }: FeatureBentoProps) {
    return (
        <BentoGrid>
            <ProjectsCard locale={locale} animationDelay={0} />
            <RoleSystemCard locale={locale} animationDelay={120} />
            <OrganizationCard locale={locale} animationDelay={240} />
            <MemberManagementCard locale={locale} animationDelay={360} />
        </BentoGrid>
    )
}
