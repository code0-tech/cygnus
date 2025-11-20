"use client"

import {NextPage} from "next"
import {HeroSection} from "@/sections/HeroSection"
import {FeatureSection} from "@/sections/FeatureSection"
import {FaqSection} from "@/sections/FaqSection"
import {ContactSection} from "@/sections/ContactSection"
import {RoadmapSection} from "@/sections/RoadmapSection"
import {UseCaseSection} from "@/sections/UseCaseSection"
import {BrandSection} from "@/sections/BrandSection"
import React from "react"
import {Container} from "@code0-tech/pictor"

const LandingPage: NextPage = () => {
    return (
        <Container className={"flex flex-col bg-primary py-[5%] border-x border-white/10"}>
            <HeroSection/>
            <div className={"pt-4 -mx-4 border-b border-white/10"}/>
            <BrandSection/>
            <div className={"h-16 -mx-4 border-t border-white/10"}/>
            <UseCaseSection/>
            <div className={"h-32 -mx-4 border-t border-white/10"}/>
            <FeatureSection/>
            <div className={"h-32 -mx-4 border-t border-white/10"}/>
            <RoadmapSection/>
            <FaqSection/>
            <ContactSection/>
        </Container>
    )
}

export default LandingPage