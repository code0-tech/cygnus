import { Section } from "@/components/ui/Section"
import { type AppLocale } from "@/lib/i18n"
import { MemberManagementCard } from "../cards/MemberManagementCard"
import { OrganizationCard } from "../cards/OrganizationCard"
import { RoleSystemCard } from "../cards/RoleSystemCard"
import { ProjectsCard } from "../cards/ProjectsCard"
import { BentoGrid } from "../ui/BentoGrid"

interface AppFeatureSectionProps {
    locale: AppLocale
}

export const AppFeatureSection: React.FC<AppFeatureSectionProps> = ({ locale }) => {
    return (
        <Section sectionType="AppFeatureSection" fullHeight>
            <BentoGrid>
                <ProjectsCard locale={locale} />
                <RoleSystemCard locale={locale} />
                <OrganizationCard locale={locale} />
                <MemberManagementCard locale={locale} />
            </BentoGrid>
        </Section>
    )
}
