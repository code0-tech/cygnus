import { FeatureCard } from "@/components/cards/FeatureCard"
import { Section } from "@/components/ui/Section"
import React from "react"
import { BentoGrid } from "../ui/BentoGrid"

export const RuntimeFeatureSection: React.FC = () => {
    return (
        <Section sectionType="RuntimeFeatureSection">
            <BentoGrid columns={3}>
                <FeatureCard className="col-span-2 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-3">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-2">test</FeatureCard>
                <FeatureCard className="col-span-1 row-span-1">test</FeatureCard>
            </BentoGrid>
        </Section>
    )
}
