import { AdapterCard } from "@/components/cards/AdapterCard"
import { ProjectCard } from "@/components/cards/ProjectCard"
import { RuntimeCard } from "@/components/cards/RuntimeCard"
import { SuggestionCard } from "@/components/cards/SuggestionCard"
import { Section } from "@/components/Section"
import React from "react"

export const FeatureSection: React.FC = () => {
    return (
        <Section translationKey="FeatureSection">
            <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-fr p-4"}>
                <AdapterCard/>
                <SuggestionCard/>
                <RuntimeCard/>
                <ProjectCard/>
            </div>
        </Section>
    )
}
