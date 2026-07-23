"use client"

import { NodeDisplay, type NodeItem } from "@/components/nodes/NodeDisplay"
import { useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"

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
                    <NodeDisplay key={`${direction}-${node.color}-${index}`} node={node} />
                ))}
            </div>
            <div className="flex items-start gap-4" aria-hidden="true">
                {nodes.map((node, index) => (
                    <NodeDisplay key={`${direction}-clone-${node.color}-${index}`} node={node} />
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
