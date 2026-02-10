import { FeatureCard } from "@/components/cards/FeatureCard"
import { Section } from "@/components/Section"
import React from "react"

export const RuntimeFeatureSection: React.FC = () => {
    return (
        <Section translationKey="RuntimeFeatureSection">
            <div className={"w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:grid-rows-[repeat(3,280px)] p-4"}>
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
