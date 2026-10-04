"use client"

import { StableBadge } from "@/components/ui/StableBadge"
import { Card, Flex, Text } from "@code0-tech/pictor"
import { IconNote, IconVariable } from "@tabler/icons-react"
import type { CSSProperties, ReactNode } from "react"

type NodeSegmentType = "text" | "literal" | "reference" | "node"
type NodeAccent = "brand" | "yellow" | "aqua" | "blue" | "pink" | "lime" | "magenta"

const ICON_COLOR_MAP: Record<NodeAccent, string> = {
    brand: "var(--bg-brand)",
    yellow: "var(--bg-yellow)",
    aqua: "var(--bg-aqua)",
    blue: "var(--bg-blue)",
    pink: "var(--bg-pink)",
    lime: "var(--bg-lime)",
    magenta: "var(--bg-magenta)",
}

export interface NodeSegment {
    type: NodeSegmentType
    value: string
}

export interface NodeItem {
    icon?: ReactNode
    color: NodeAccent
    segments: NodeSegment[]
    outline: boolean
}

function NodeMessage({ segments }: { segments: NodeSegment[] }) {
    return segments.map((segment, index) => {
        switch (segment.type) {
            case "literal":
                return (
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle" }} color="secondary">
                        <Text size="sm" style={{ color: "white" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "reference":
                return (
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle" }} color="warning" border className="py-0">
                        <IconVariable size={12} />
                        <Text size="sm" style={{ color: "inherit" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "node":
                return (
                    <StableBadge
                        key={`${segment.type}-${segment.value}-${index}`}
                        style={{ verticalAlign: "middle", textWrap: "nowrap" }}
                        border
                        className="border-white/20! bg-white/8! shadow-[0_2px_8px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    >
                        <IconNote size={12} className="text-brand" />
                        <Text size="sm" style={{ color: "white" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "text":
                return (
                    <Text key={`${segment.type}-${index}`} size="md" style={{ color: "inherit" }}>
                        {segment.value}
                    </Text>
                )
        }
    })
}

export function NodeDisplay({ node, animatedOutline = false }: { node: NodeItem; animatedOutline?: boolean }) {
    return (
        <Card
            paddingSize="xs"
            py="0.35"
            borderColor="info"
            color="primary"
            outline={node.outline}
            className={
                animatedOutline && node.outline
                    ? "after:pointer-events-none after:absolute after:-inset-[calc(var(--padding)/3)] after:rounded-[calc(1rem+var(--padding)/3)] after:border after:border-[var(--node-accent-color)] after:opacity-[var(--node-accent-opacity,0)]"
                    : undefined
            }
            style={{ "--node-accent-color": ICON_COLOR_MAP[node.color] } as CSSProperties}
        >
            <Flex align="center" style={{ gap: "0.7rem" }}>
                <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4" style={{ color: ICON_COLOR_MAP[node.color] }}>
                    {node.icon ?? <IconNote size={16} />}
                </span>
                <Flex align="center" wrap="wrap" className="text-secondary!" style={{ gap: "0.35rem" }}>
                    <NodeMessage segments={node.segments} />
                </Flex>
            </Flex>
        </Card>
    )
}
