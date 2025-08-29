"use client"

import {NextPage} from "next"
import {Navigation} from "@/components/Navigation"
import {HeroSection} from "@/sections/HeroSection"
import {BrandSection} from "@/sections/BrandSection"
import {FeatureSection} from "@/sections/FeatureSection"
import {TestimonialSection} from "@/sections/TestimonialSection"
import {FaqSection} from "@/sections/FaqSection"
import {DemoSection} from "@/sections/DemoSection"
import {QuoteSection} from "@/sections/QuoteSection"
import {ContactSection} from "@/sections/ContactSection"

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
            <BrandSection/>
            <div className="h-12 mx-[10%] border-x border-white/10" />
            <FeatureSection/>
            <div className={"h-12 grid grid-cols-[10%_80%_10%]"}>
                <div className="border-b border-dashed border-white/10" />
                <div className="border-b border-dashed border-x border-white/10" />
                <div className="border-b border-dashed border-white/10" />
            </div>
            <DemoSection/>

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

            <TestimonialSection/>
            <FaqSection/>
            <ContactSection/>
        </div>
    )
}

export default LandingPage