import { FeatureCard } from "@/components/cards/FeatureCard"
import { Section } from "@/components/Section"
import React from "react"

export const AppFeatureSection: React.FC = () => {
    return (
        <Section translationKey="AppFeatureSection">
            <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-4 md:grid-rows-[repeat(5,160px)] p-4"}>
                <FeatureCard className="col-span-1 md:col-span-2 row-span-3">test</FeatureCard>
                <FeatureCard className="col-span-1 md:col-span-3 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 md:col-span-2 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 md:col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 md:col-span-3 row-span-3">test</FeatureCard>
                <FeatureCard className="col-span-1 md:col-span-2 row-span-2">test</FeatureCard>
            </div>
        </Section>
    )
}
