"use client"

import { StableBadge } from "@/components/ui/StableBadge"
import { Card, Flex, Text } from "@code0-tech/pictor"
import { IconNote, IconVariable } from "@tabler/icons-react"

export type NodeSegmentType = "text" | "literal" | "reference" | "node"
export type NodeAccent = "brand" | "yellow" | "aqua" | "blue" | "pink"

const ICON_COLOR_MAP: Record<NodeAccent, string> = {
    brand: "var(--bg-brand)",
    yellow: "var(--bg-yellow)",
    aqua: "var(--bg-aqua)",
    blue: "var(--bg-blue)",
    pink: "var(--bg-pink)",
}

export function getNodeAccentColor(accent: NodeAccent) {
    return ICON_COLOR_MAP[accent]
}

export interface NodeSegment {
    type: NodeSegmentType
    value: string
}

export interface NodeItem {
    color: NodeAccent
    segments: NodeSegment[]
    outline: boolean
}

export function NodeMessage({ segments }: { segments: NodeSegment[] }) {
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
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle", textWrap: "nowrap" }} border>
                        <IconNote size={12} className="text-white" />
                        <Text size="sm" style={{ color: "white" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "text":
                return (
                    <Text key={`${segment.type}-${index}`} size="sm" style={{ color: "inherit" }}>
                        {segment.value}
                    </Text>
                )
        }
    })
}

export function NodeDisplay({ node }: { node: NodeItem }) {
    return (
        <Card paddingSize="xs" py="0.35" borderColor="info" color="primary" outline={node.outline}>
            <Flex align="center" style={{ gap: "0.7rem" }}>
                <IconNote color={ICON_COLOR_MAP[node.color]} size={16} className="shrink-0" />
                <Flex align="center" wrap="wrap" className="text-secondary!" style={{ gap: "0.35rem" }}>
                    <NodeMessage segments={node.segments} />
                </Flex>
            </Flex>
        </Card>
    )
}
