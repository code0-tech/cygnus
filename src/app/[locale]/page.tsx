import { LandingContainer } from "@/components/LandingContainer"
import { SectionDivider } from "@/components/SectionDivider"
import { BrandSection } from "@/sections/BrandSection"
import { ContactSection } from "@/sections/ContactSection"
import { FaqSection } from "@/sections/FaqSection"
import { FeatureSection } from "@/sections/FeatureSection"
import { HeroSection } from "@/sections/HeroSection"
import { RoadmapSection } from "@/sections/RoadmapSection"
import { UseCaseSection } from "@/sections/UseCaseSection"

export default function Page() {
    return (
        <LandingContainer>
            <HeroSection/>
            <SectionDivider height={0}/>
            <BrandSection/>
            <SectionDivider height={64}/>
            <UseCaseSection/>
            <SectionDivider height={128}/>
            <FeatureSection/>
            <SectionDivider height={128}/>
            <RoadmapSection/>
            <FaqSection/>
            <ContactSection/>
        </LandingContainer>
    )
}
