"use client"

import { Card, Flex, Text } from "@code0-tech/pictor"
import { m as motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

export interface FlowDiagramNode {
    icon: ReactNode
    text: string
    id: string
}

function FlowNode({ node, trigger }: { node: FlowDiagramNode; trigger?: boolean }) {
    return (
        <Card paddingSize="xs" py="0.35" borderColor="info" color="primary" outline className="relative z-10 min-w-44 shrink-0">
            <Flex align="center" style={{ gap: "0.7rem" }}>
                <span className={trigger ? "shrink-0 text-brand" : "shrink-0 text-white"}>{node.icon}</span>
                <Flex align="center" wrap="wrap" className="text-secondary!" style={{ gap: "0.35rem" }}>
                    <Text size="sm" style={{ color: "inherit" }}>
                        {node.text}
                    </Text>
                </Flex>
            </Flex>
        </Card>
    )
}

export function FlowExampleDiagram({ trigger, items }: { trigger: FlowDiagramNode; items: FlowDiagramNode[] }) {
    const reducedMotion = useReducedMotion()
    const nodes = [trigger, ...items]

    return (
        <motion.div
            className="flex h-full min-h-64 flex-col items-center justify-center overflow-hidden px-8 py-12"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
        >
            {nodes.map((node, index) => (
                <div className="flex flex-col items-center" key={node.id}>
                    {index > 0 && (
                        <div className="relative h-12 w-px overflow-hidden bg-white/10 md:h-16" aria-hidden="true">
                            <motion.div
                                className="absolute inset-0 origin-top bg-brand"
                                variants={{
                                    hidden: { scaleY: reducedMotion ? 1 : 0 },
                                    show: { scaleY: 1 },
                                }}
                                transition={{ duration: 0.55, delay: 0.22 + index * 0.2, ease: [0.22, 1, 0.36, 1] }}
                            />
                            <motion.span
                                className="absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white"
                                variants={{
                                    hidden: { top: "0%", opacity: 0 },
                                    show: { top: "100%", opacity: [0, 1, 0] },
                                }}
                                transition={{ duration: 0.55, delay: 0.22 + index * 0.2, ease: "easeInOut" }}
                            />
                        </div>
                    )}
                    <motion.div
                        variants={{
                            hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 },
                            show: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.38, delay: index * 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <FlowNode node={node} trigger={index === 0} />
                    </motion.div>
                </div>
            ))}
        </motion.div>
    )
}
