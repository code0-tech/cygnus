import { LandingContainer } from "@/components/LandingContainer";
import { SectionDivider } from "@/components/SectionDivider";
import { HeroSection } from "@/sections/HeroSection";
import dynamic from "next/dynamic";

const BrandSection = dynamic(() => import('@/sections/BrandSection').then(mod => mod.BrandSection));
const UseCaseSection = dynamic(() => import('@/sections/UseCaseSection').then(mod => mod.UseCaseSection));
const FeatureSection = dynamic(() => import('@/sections/FeatureSection').then(mod => mod.FeatureSection));
const RoadmapSection = dynamic(() => import('@/sections/RoadmapSection').then(mod => mod.RoadmapSection));
const FaqSection = dynamic(() => import('@/sections/FaqSection').then(mod => mod.FaqSection));
const ContactSection = dynamic(() => import('@/sections/ContactSection').then(mod => mod.ContactSection));

export default function Page() {
    return (
        <LandingContainer>
            <HeroSection/>
            <SectionDivider height={0}/>
            <BrandSection />
            <SectionDivider height={0}/>
            <UseCaseSection/>
            <SectionDivider height={0}/>
            <FeatureSection/>
            <SectionDivider height={0}/>
            <RoadmapSection/>
            <FaqSection/>
            <ContactSection/>
        </LandingContainer>
    )
}
