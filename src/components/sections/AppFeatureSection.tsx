import { FeatureCard } from "@/components/cards/FeatureCard"
import { Section } from "@/components/ui/Section"

export const AppFeatureSection: React.FC = () => {
    return (
        <Section sectionType="AppFeatureSection">
            <div className={"w-full h-dvh grid grid-cols-1 md:grid-cols-5 gap-4 grid-rows-auto p-4 py-16"}>
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
