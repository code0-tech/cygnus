import { getIcon } from "@/components/IconRenderer"
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Card } from "@/components/ui/Card"
import { Section } from "@/components/ui/Section"
import type { FlowExampleLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { FlowExampleDiagram, type FlowDiagramNode } from "./client/FlowExampleDiagram"

interface FlowExampleSectionProps {
    content?: FlowExampleLayoutBlock | null
}

export function FlowExampleSection({ content }: FlowExampleSectionProps) {
    const trigger = content?.flow?.trigger
    if (!content || !trigger?.name) return null

    const triggerNode: FlowDiagramNode = {
        id: "trigger",
        icon: getIcon(trigger.icon, 20),
        text: trigger.name,
    }
    const items: FlowDiagramNode[] =
        content.flow?.items?.map((item, index) => ({
            id: String(item.id ?? index),
            icon: getIcon(item.icon, 20, item.id ?? index),
            text: item.text,
        })) ?? []
    const isCenter = content.sectionLayout === "flowCenter"
    const isRight = content.sectionLayout === "flowRight"
    const flow = (
        <div
            className={cn(
                "relative m-2 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-primary/40",
                isCenter ? "min-h-72" : "min-h-72 lg:min-h-96",
                isRight && "lg:order-2"
            )}
        >
            <FlowExampleDiagram trigger={triggerNode} items={items} />
        </div>
    )
    const body = (
        <StaggerContainer className={cn("flex flex-col justify-center p-8 md:p-10", isRight && "lg:order-1")} delayChildren={0.06} staggerChildren={0.08}>
            {content.contentHeading && (
                <StaggerItem as="h2" y={14} duration={0.38} className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
                    {content.contentHeading}
                </StaggerItem>
            )}
            {content.contentDescription && (
                <StaggerItem as="p" y={14} duration={0.38} className="mt-4 max-w-2xl text-base leading-7 text-secondary md:text-lg">
                    {content.contentDescription}
                </StaggerItem>
            )}
        </StaggerContainer>
    )

    const example = <article className={cn("relative z-10 overflow-hidden", isCenter ? "flex flex-col" : "grid lg:grid-cols-2")}>{isCenter ? <>{flow}{(content.contentHeading || content.contentDescription) && body}</> : <>{flow}{body}</>}</article>

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType="center"
            animation={{ preset: "none" }}
        >
            <div className={cn("mx-auto w-full", isCenter && "max-w-5xl")}>
                {content.showBorder ? <Card size="lg" variant="light" className="p-2!">{example}</Card> : example}
            </div>
        </Section>
    )
}
