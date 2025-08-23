"use client"

import {NextPage} from "next"
import {Navigation} from "@/components/Navigation"
import {MainHeaderSection} from "@/components/MainHeaderSection"
import {FlowSection} from "@/static-components/FlowSection"
import {IntegrationsSection} from "@/static-components/IntegrationsSection"
import {AdaptersSection} from "@/static-components/AdaptersSection"
import {CommunitySection} from "@/static-components/CommunitySection"
import {OpenSourceSection} from "@/static-components/OpenSourceSection"
import {BrandSection} from "@/static-components/BrandSection"
import {FooterSection} from "@/static-components/FooterSection"

const LandingPage: NextPage = () => {
    return (
        <div className={"bg-primary max-w-screen"}>
            <Navigation/>
            <MainHeaderSection/>
            <BrandSection/>
            <FlowSection/>
            <OpenSourceSection/>
            <IntegrationsSection/>
            <AdaptersSection/>
            <CommunitySection/>
        </div>
    )
}

export default LandingPage