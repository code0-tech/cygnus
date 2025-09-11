"use client"

import {NextPage} from "next"
import {Navigation} from "@/components/Navigation"
import {HeroSection} from "@/sections/HeroSection"
import {FeatureSection} from "@/sections/FeatureSection"
import {FaqSection} from "@/sections/FaqSection"
import {QuoteSection} from "@/sections/QuoteSection"
import {ContactSection} from "@/sections/ContactSection"
import {RoadmapSection} from "@/sections/RoadmapSection"

const LandingPage: NextPage = () => {
    return (
        <div className={"w-full bg-primary max-w-screen"}>
            <Navigation/>
            <HeroSection/>
            <div className={"h-12 grid grid-cols-[10%_80%_10%]"}>
                <div className="border-t border-dashed border-white/10" />
                <div className="border-t border-dashed border-x border-white/10" />
                <div className="border-t border-dashed border-white/10" />
            </div>
            <FeatureSection/>
            <div className={"h-12 grid grid-cols-[10%_80%_10%]"}>
                <div className="border-b border-dashed border-white/10" />
                <div className="border-b border-dashed border-x border-white/10" />
                <div className="border-b border-dashed border-white/10" />
            </div>
            <RoadmapSection/>
            <div className={"h-12 grid grid-cols-[10%_80%_10%]"}>
                <div className="border-t border-dashed border-white/10" />
                <div className="border-t border-dashed border-x border-white/10" />
                <div className="border-t border-dashed border-white/10" />
            </div>
            <QuoteSection/>
            <div className={"h-12 grid grid-cols-[10%_80%_10%]"}>
                <div className="border-b border-dashed border-white/10" />
                <div className="border-b border-dashed border-x border-white/10" />
                <div className="border-b border-dashed border-white/10" />
            </div>

            <FaqSection/>
            <ContactSection/>
        </div>
    )
}

export default LandingPage