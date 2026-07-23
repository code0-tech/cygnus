"use client"

import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Section } from "@/components/ui/Section"
import type { StatsLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { useInView } from "motion/react"
import { useRef } from "react"

interface StatsSectionProps {
    content?: StatsLayoutBlock | null
}

function getCompactNumber(number: number) {
    const absoluteNumber = Math.abs(number)

    if (absoluteNumber >= 1_000_000_000) return { value: Math.round(number / 1_000_000_000), suffix: "B" }
    if (absoluteNumber >= 1_000_000) return { value: Math.round(number / 1_000_000), suffix: "M" }
    if (absoluteNumber >= 1_000) return { value: Math.round(number / 1_000), suffix: "K" }

    return { value: Math.round(number), suffix: "" }
}

function StatNumber({ number, animate, suffix }: { number: number; animate: boolean; suffix?: string | null }) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, amount: 0.5 })
    const compactNumber = getCompactNumber(number)
    const displaySuffix = `${compactNumber.suffix}${suffix?.trim() ?? ""}`

    return (
        <div ref={ref} className="text-5xl font-semibold tabular-nums text-white md:text-6xl">
            <NumberFlow
                value={animate && !isInView ? 0 : compactNumber.value}
                suffix={!animate || isInView ? displaySuffix : ""}
                animated={animate}
                transformTiming={{ duration: 1200, easing: "ease-out" }}
            />
        </div>
    )
}

export function StatsSection({ content }: StatsSectionProps) {
    if (!content?.items?.length) return null

    const desktopColumns = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
    }[content.items.length]

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <StaggerContainer className={cn("grid w-full grid-cols-1", desktopColumns)} delayChildren={0.06} staggerChildren={0.12}>
                {content.items.map((item, index) => (
                    <StaggerItem
                        className={cn(
                            "flex flex-col gap-3 py-8 text-center first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0",
                            index > 0 && "border-t border-white/10 md:border-l md:border-t-0"
                        )}
                        y={18}
                        duration={0.4}
                        key={item.id ?? index}
                    >
                        <StatNumber number={item.number} animate={item.enableNumberFlow !== false} suffix={item.suffix} />
                        <p className="text-lg font-medium text-secondary">{item.description}</p>
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </Section>
    )
}
