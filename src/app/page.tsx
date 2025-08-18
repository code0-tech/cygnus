"use client"

import {NextPage} from "next"
import {Navigation} from "@/components/Navigation"
import {MainHeaderSection} from "@/components/MainHeaderSection"
import {FlowSection} from "@/static-components/FlowSection"
import {IntegrationsSection} from "@/static-components/IntegrationsSection"
import {AdaptersSection} from "@/static-components/AdaptersSection"
import {CommunitySection} from "@/static-components/CommunitySection"
import {OpenSourceSection} from "@/static-components/OpenSourceSection"

const LandingPage: NextPage = () => {
    return <div className={"bg-primary max-w-screen"}>
        <Navigation/>
        <MainHeaderSection/>
        <FlowSection/>
        <OpenSourceSection/>
        <IntegrationsSection/>
        <AdaptersSection/>
        <CommunitySection/>
    </div>

}

export default LandingPage