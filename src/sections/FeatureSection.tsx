import React from "react"
import { AdapterCard } from "@/components/cards/AdapterCard"
import {ProjectCard} from "@/components/cards/ProjectCard"
import {RuntimeCard} from "@/components/cards/RuntimeCard"
import {SuggestionCard} from "@/components/cards/SuggestionCard"

export const FeatureSection: React.FC = () => {
    return (
        <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-16 auto-rows-fr"}>
            <AdapterCard/>
            <SuggestionCard/>
            <RuntimeCard/>
            <ProjectCard/>
        </div>
    )
}