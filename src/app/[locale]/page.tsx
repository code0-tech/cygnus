import {NextPage} from "next"
import {HeroSection} from "@/sections/HeroSection"
import {FeatureSection} from "@/sections/FeatureSection"
import {FaqSection} from "@/sections/FaqSection"
import {ContactSection} from "@/sections/ContactSection"
import {RoadmapSection} from "@/sections/RoadmapSection"
import {UseCaseSection} from "@/sections/UseCaseSection"
import {BrandSection} from "@/sections/BrandSection"
import React from "react"
import {LandingContainer} from "@/components/LandingContainer"
import {SectionDivider} from "@/components/SectionDivider"

const Page: NextPage = () => {
    return (
        <LandingContainer>
            <HeroSection/>
            <SectionDivider height={16} side={"bottom"}/>
            <BrandSection/>
            <SectionDivider height={64} side={"top"}/>
            <UseCaseSection/>
            <SectionDivider height={128} side={"top"}/>
            <FeatureSection/>
            <SectionDivider height={128} side={"top"}/>
            <RoadmapSection/>
            <FaqSection/>
            <ContactSection/>
        </LandingContainer>
    )
}

export default Page