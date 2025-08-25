"use client"

import {NextPage} from "next"
import {Navigation} from "@/components/Navigation"
import {HeroSection} from "@/sections/HeroSection"
import {BrandSection} from "@/sections/BrandSection"
import {FeatureSection} from "@/sections/FeatureSection"
import {TestimonialSection} from "@/sections/TestimonialSection"

const LandingPage: NextPage = () => {
    return (
        <div className={"bg-primary max-w-screen"}>
            <Navigation/>
            <HeroSection/>
            <BrandSection/>
            <FeatureSection/>
            <TestimonialSection/>
        </div>
    )
}

export default LandingPage