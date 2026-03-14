"use client"

import { Card, Flex, Text } from "@code0-tech/pictor"
import { IconNote } from "@tabler/icons-react"
import { motion } from "motion/react"
import { LiteralBadge } from "../badges/LiteralBadge"
import { ReferenceBadge } from "../badges/ReferenceBadge"
import { NodeBadge } from "../badges/NodeBadge"

type NodeSegmentType = "text" | "literal" | "reference" | "node"
type NodeAccent = "brand" | "yellow" | "aqua" | "blue" | "pink"

interface NodeSegment {
    type: NodeSegmentType
    value: string
}

interface NodeItem {
    color: NodeAccent
    segments: NodeSegment[]
    outline: boolean
}

function NodeRow({
    nodes,
    direction,
}: {
    nodes: NodeItem[]
    direction: "left" | "right"
}) {
    const repeatedNodes = Array.from({ length: 2 }, () => nodes).flat()
    const loopNodes = [...repeatedNodes, ...repeatedNodes]
    const iconColorMap: Record<NodeAccent, string> = {
        brand: "var(--text-brand)",
        yellow: "var(--text-yellow)",
        aqua: "var(--text-aqua)",
        blue: "var(--text-blue)",
        pink: "var(--text-pink)",
    }

    const displayMessage = (segments: NodeSegment[]) => {
        return segments.map((segment, index) => {
            switch (segment.type) {
                case "literal":
                    return <LiteralBadge key={`${segment.type}-${index}`} value={segment.value} />
                case "reference":
                    return <ReferenceBadge key={`${segment.type}-${index}`} value={segment.value} />
                case "node":
                    return <NodeBadge key={`${segment.type}-${index}`} value={segment.value} />
                case "text":
                    return <Text key={`${segment.type}-${index}`} size="sm" style={{ color: "inherit" }}>
                        {segment.value}
                    </Text>
            }
        })
    }

    return (
        <motion.div
            className="flex w-max items-start gap-4"
            animate={direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] }}
            transition={{
                duration: 90,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
            }}
        >
            {loopNodes.map((node, index) => (
                <Card
                    key={`${direction}-${node.color}-${index}`}
                    paddingSize="xs"
                    py="0.35"
                    borderColor="info"
                    color="primary"
                    outline={node.outline}
                >
                    <Flex align="center" style={{ gap: "0.7rem" }}>
                        <IconNote color={iconColorMap[node.color]} size={16} />
                        <Flex align="center" wrap="wrap" style={{ gap: "0.35rem", color: "var(--color-text-primary)" }}>
                            {displayMessage(node.segments)}
                        </Flex>
                    </Flex>
                </Card>
            ))}
        </motion.div>
    )
}

export function NodesAnimation() {
    const nodes: NodeItem[] = [
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
            segments: [
                { type: "text", value: "Only continue if status equals approved" },
            ],
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
            segments: [
                { type: "text", value: "This node only contains plain text" },
            ],
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

    const splitIndex = Math.ceil(nodes.length / 2)
    const topRowNodes = nodes.slice(0, splitIndex)
    const bottomRowNodes = nodes.slice(splitIndex)

    return (
        <div className="relative flex h-full flex-col justify-center gap-3 overflow-hidden cursor-default">
            <div className="relative">
                <NodeRow nodes={topRowNodes} direction="left" />
            </div>
            <div className="relative pl-10">
                <NodeRow nodes={bottomRowNodes} direction="right" />
            </div>
        </div>
    )
}
