import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Card } from "@/components/ui/Card"
import { PlaygroundFrame } from "@/components/ui/PlaygroundFrame"
import { Section } from "@/components/ui/Section"
import type { FlowExampleLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"

interface FlowExampleSectionProps {
    content?: FlowExampleLayoutBlock | null
}

export function FlowExampleSection({ content }: FlowExampleSectionProps) {
    if (!content?.playgroundUrl) return null

    const isFlowRight = content.flowLayout === "right"
    const showBorder = Boolean(content.showBorder)
    const flow = (
        <div className={cn("relative m-2 min-h-72 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-light/50 lg:min-h-96", isFlowRight && "lg:order-2")}>
            <PlaygroundFrame url={content.playgroundUrl} title={`${content.contentHeading || content.sectionHeading || "Flow example"} playground`} />
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
