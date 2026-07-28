import type { BentoLayoutBlock } from "@/lib/cms"
import { BentoGrid } from "../ui/BentoGrid"
import { ProjectsCard } from "../cards/ProjectsCard"
import { RoleSystemCard } from "../cards/RoleSystemCard"
import { OrganizationCard } from "../cards/OrganizationCard"
import { MemberManagementCard } from "../cards/MemberManagementCard"

interface FeatureBentoProps {
    content?: BentoLayoutBlock["featureContent"]
}

export function FeatureBento({ content }: FeatureBentoProps) {
    return (
        <BentoGrid>
            <ProjectsCard content={content?.projects} animationDelay={0} />
            <RoleSystemCard content={content?.roleSystem} animationDelay={120} />
            <OrganizationCard content={content?.organizations} animationDelay={240} />
            <MemberManagementCard content={content?.memberManagement} animationDelay={360} />
        </BentoGrid>
    )
}
