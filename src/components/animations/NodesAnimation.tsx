"use client"

import { Card, Flex, Text } from "@code0-tech/pictor"
import { IconNote, IconVariable } from "@tabler/icons-react"
import { useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"
import { StableBadge } from "../ui/StableBadge"

type NodeSegmentType = "text" | "literal" | "reference" | "node"
type NodeAccent = "brand" | "yellow" | "aqua" | "blue" | "pink"

const ICON_COLOR_MAP: Record<NodeAccent, string> = {
    brand: "var(--bg-brand)",
    yellow: "var(--bg-yellow)",
    aqua: "var(--bg-aqua)",
    blue: "var(--bg-blue)",
    pink: "var(--bg-pink)",
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

function displayMessage(segments: NodeSegment[]) {
    return segments.map((segment, index) => {
        switch (segment.type) {
            case "literal":
                return (
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle" }} color={"secondary"}>
                        <Text size={"sm"} style={{ color: "white" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "reference":
                return (
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle" }} color={"warning"} border className="py-0">
                        <IconVariable size={12} />
                        <Text size={"sm"} style={{ color: "inherit" }}>
                            {segment.value}
                        </Text>
                    </StableBadge>
                )
            case "node":
                return (
                    <StableBadge key={`${segment.type}-${segment.value}-${index}`} style={{ verticalAlign: "middle", textWrap: "nowrap" }} border>
                        <IconNote size={12} className="text-white" />
                        <Text size={"sm"} style={{ color: "white" }}>
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

function NodeRow({ nodes, direction, active }: { nodes: NodeItem[]; direction: "left" | "right"; active: boolean }) {
    const animationRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const groupGap = 16
    const velocity = 28

    useEffect(() => {
        const listElement = listRef.current
        if (!listElement) return

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return

            const loopDistance = Math.round(entry.contentRect.width + groupGap)
            if (animationRef.current) {
                animationRef.current.style.animationDuration = `${loopDistance / velocity}s`
            }
        })
        resizeObserver.observe(listElement)

        return () => resizeObserver.disconnect()
    }, [])

    return (
        <div
            ref={animationRef}
            className="flex w-max items-start gap-4 will-change-transform"
            style={{
                animationName: direction === "left" ? "node-marquee-left" : "node-marquee-right",
                animationDuration: "0s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationPlayState: active ? "running" : "paused",
            }}
        >
            <div ref={listRef} className="flex items-start gap-4">
                {nodes.map((node, index) => (
                    <Card key={`${direction}-${node.color}-${index}`} paddingSize="xs" py="0.35" borderColor="info" color="primary" outline={node.outline}>
                        <Flex align="center" style={{ gap: "0.7rem" }}>
                            <IconNote color={ICON_COLOR_MAP[node.color]} size={16} className="shrink-0" />
                            <Flex align="center" wrap="wrap" className="text-secondary!" style={{ gap: "0.35rem" }}>
                                {displayMessage(node.segments)}
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>
            <div className="flex items-start gap-4" aria-hidden="true">
                {nodes.map((node, index) => (
                    <Card key={`${direction}-clone-${node.color}-${index}`} paddingSize="xs" py="0.35" borderColor="info" color="primary" outline={node.outline}>
                        <Flex align="center" style={{ gap: "0.7rem" }}>
                            <IconNote color={ICON_COLOR_MAP[node.color]} size={16} className="shrink-0" />
                            <Flex align="center" wrap="wrap" className="text-secondary!" style={{ gap: "0.35rem" }}>
                                {displayMessage(node.segments)}
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>
        </div>
    )
}

const defaultNodes: NodeItem[] = [
    {
        color: "pink",
        outline: true,
        segments: [
            { type: "text", value: "Convert" },
            { type: "reference", value: "value" },
            { type: "text", value: "to boolean" },
        ],
    },
    {
        color: "brand",
        outline: true,
        segments: [
            { type: "text", value: "Use fallback" },
            { type: "literal", value: "false" },
            { type: "text", value: "when empty" },
        ],
    },
    {
        color: "yellow",
        outline: true,
        segments: [
            { type: "text", value: "Run node" },
            { type: "node", value: "formatDate" },
            { type: "text", value: "with current input" },
        ],
    },
    {
        color: "blue",
        outline: true,
        segments: [{ type: "text", value: "Only continue if status equals approved" }],
    },
    {
        color: "aqua",
        outline: true,
        segments: [
            { type: "text", value: "Map" },
            { type: "reference", value: "user.email" },
            { type: "text", value: "to contact field" },
        ],
    },
    {
        color: "blue",
        outline: true,
        segments: [
            { type: "text", value: "Set timeout to" },
            { type: "literal", value: "30" },
            { type: "text", value: "seconds" },
        ],
    },
    {
        color: "brand",
        outline: true,
        segments: [
            { type: "text", value: "Trigger" },
            { type: "node", value: "sendMail" },
            { type: "text", value: "after validation" },
        ],
    },
    {
        color: "pink",
        outline: true,
        segments: [{ type: "text", value: "This node only contains plain text" }],
    },
    {
        color: "yellow",
        outline: true,
        segments: [
            { type: "text", value: "Compare" },
            { type: "reference", value: "invoice.total" },
            { type: "text", value: "with" },
            { type: "literal", value: "1000" },
        ],
    },
]

interface NodesAnimationProps {
    nodes?: NodeItem[]
}

export function NodesAnimation({ nodes = defaultNodes }: NodesAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })
    const prefersReducedMotion = useReducedMotion()

    const splitIndex = Math.ceil(nodes.length / 2)
    const topRowNodes = nodes.slice(0, splitIndex)
    const bottomRowNodes = nodes.slice(splitIndex)

    return (
        <div ref={containerRef} className="relative flex h-full cursor-default flex-col justify-center gap-3 overflow-hidden">
            <div className="relative">
                <NodeRow nodes={topRowNodes} direction="left" active={isInView && !prefersReducedMotion} />
            </div>
            <div className="relative pl-10">
                <NodeRow nodes={bottomRowNodes} direction="right" active={isInView && !prefersReducedMotion} />
            </div>
        </div>
    )
}
