import { FeatureCard } from "@/components/cards/FeatureCard"
import { Section } from "@/components/ui/Section"
import React from "react"

export const RuntimeFeatureSection: React.FC = () => {
    return (
        <Section sectionType="RuntimeFeatureSection">
            <div className={"w-full h-dvh grid grid-cols-1 md:grid-cols-3 gap-4 grid-rows-auto p-4 py-16"}>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-2">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-2">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
            </div>
        </Section>
    )
}
