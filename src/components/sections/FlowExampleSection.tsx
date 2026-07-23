import { getIcon } from "@/components/IconRenderer"
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Card } from "@/components/ui/Card"
import { DotBackground } from "@/components/ui/DotBackground"
import { Section } from "@/components/ui/Section"
import type { FlowExampleLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import type { NodeAccent, NodeSegmentType } from "@/components/nodes/NodeDisplay"
import { FlowExampleDiagram, type FlowDiagramItem, type FlowDiagramNode } from "./client/FlowExampleDiagram"

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
    const items: FlowDiagramItem[] =
        content.flow?.items?.map((item, index) => ({
            id: String(item.id ?? index),
            node: {
                icon: getIcon(item.icon, 16),
                color: item.color as NodeAccent,
                outline: item.outline !== false,
                segments: item.segments.map((segment) => ({
                    type: segment.type as NodeSegmentType,
                    value: segment.value,
                })),
            },
        })) ?? []
    const isFlowRight = content.flowLayout === "right"
    const showBorder = Boolean(content.showBorder)
    const flow = (
        <div className={cn("relative m-2 min-h-72 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-light lg:min-h-96", isFlowRight && "lg:order-2")}>
            <DotBackground
                className="opacity-50 mask-[radial-gradient(ellipse_at_center,black_35%,transparent_85%)]"
                dotColor="rgba(255,255,255,0.14)"
                dotSize={1}
                spacing={18}
            />
            <FlowExampleDiagram trigger={triggerNode} items={items} />
        </div>
    )
    const body = (
        <StaggerContainer
            className={cn(
                "flex flex-col justify-center",
                showBorder && "p-8 md:p-10",
                !showBorder && !isFlowRight && "py-8 pl-8 md:py-10 md:pl-10",
                !showBorder && isFlowRight && "py-8 pr-8 md:py-10 md:pr-10",
                isFlowRight && "lg:order-1"
            )}
            delayChildren={0.06}
            staggerChildren={0.08}
        >
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
    const example = (
        <article className="relative z-10 grid min-h-96 overflow-hidden lg:grid-cols-2">
            {flow}
            {body}
        </article>
    )

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <div className="mx-auto w-full">
                {showBorder ? (
                    <Card size="lg" variant="light" className="p-2!">
                        {example}
                    </Card>
                ) : (
                    example
                )}
            </div>
        </Section>
    )
}
