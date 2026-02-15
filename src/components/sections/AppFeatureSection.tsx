import { FeatureCard } from "@/components/cards/FeatureCard"
import { type AppLocale } from "@/utils/i18n"
import { Section } from "@/components/ui/Section"
import { WelcomeUserCard } from "../cards/WelcomeUserCard"
import { RoleSystemCard } from "../cards/RoleSystemCard"
import { MemberManagementCard } from "../cards/MemberManagementCard"
import { TeamSubscriptionCard } from "../cards/TeamSubscriptionCard"
import { OrganizationCard } from "../cards/OrganizationCard"

interface AppFeatureSectionProps {
    locale: AppLocale
}

export const AppFeatureSection: React.FC<AppFeatureSectionProps> = ({ locale }) => {
    return (
        <Section sectionType="AppFeatureSection">
            <div className={"w-full h-dvh grid grid-cols-1 md:grid-cols-5 gap-4 grid-rows-auto p-4 py-16"}>
                <WelcomeUserCard locale={locale} />
                <RoleSystemCard locale={locale} />
                <MemberManagementCard locale={locale} />
                <TeamSubscriptionCard locale={locale} />
                <OrganizationCard locale={locale} />
                <FeatureCard className="col-span-1 md:col-span-2 row-span-2">test</FeatureCard>
            </div>
        </Section>
    )
}
