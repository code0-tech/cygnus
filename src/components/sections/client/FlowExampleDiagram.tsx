"use client"

import { getNodeAccentColor, NodeDisplay, type NodeItem } from "@/components/nodes/NodeDisplay"
import { TriggerDisplay } from "@/components/nodes/TriggerDisplay"
import { m as motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

export interface FlowDiagramNode {
    icon: ReactNode
    text: string
    id: string
}

export interface FlowDiagramItem {
    id: string
    node: NodeItem
}

export function FlowExampleDiagram({ trigger, items }: { trigger: FlowDiagramNode; items: FlowDiagramItem[] }) {
    const reducedMotion = useReducedMotion()
    const nodes = [{ id: trigger.id, trigger }, ...items]
    const travelDuration = 1.2
    const stepDuration = 1.55
    const resetDuration = 0.25
    const cycleDuration = Math.max((items.length - 1) * stepDuration + travelDuration + 1.5, travelDuration + 1.5)
    const resetStart = cycleDuration - resetDuration
    const resetEnd = resetStart + 0.01

    return (
        <motion.div
            className="relative z-10 flex h-full min-h-64 flex-col items-center justify-center overflow-hidden px-8 py-12"
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
                                animate={
                                    reducedMotion
                                        ? { scaleY: 1, opacity: 0.45 }
                                        : {
                                              scaleY: [0, 0, 1, 1, 1, 1],
                                              opacity: [0, 0, 1, 1, 0, 0],
                                          }
                                }
                                transition={{
                                    duration: reducedMotion ? 0 : cycleDuration,
                                    repeat: reducedMotion ? 0 : Infinity,
                                    ease: "linear",
                                    times: [
                                        0,
                                        ((index - 1) * stepDuration) / cycleDuration,
                                        ((index - 1) * stepDuration + travelDuration) / cycleDuration,
                                        resetStart / cycleDuration,
                                        resetEnd / cycleDuration,
                                        1,
                                    ],
                                }}
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
                        {"trigger" in node ? (
                            <TriggerDisplay icon={node.trigger.icon} text={node.trigger.text} />
                        ) : (
                            <motion.div
                                className="relative isolate rounded-2xl"
                            >
                                <motion.div
                                    className="pointer-events-none absolute -inset-1 z-0 rounded-2xl blur-sm"
                                    style={{ backgroundColor: getNodeAccentColor(node.node.color) }}
                                    animate={
                                        reducedMotion
                                            ? { opacity: 0.16, scale: 1 }
                                            : {
                                                  opacity: [0, 0, 0.16, 0.16, 0, 0],
                                                  scale: [0.98, 0.98, 1, 1, 1, 1],
                                              }
                                    }
                                    transition={{
                                        duration: reducedMotion ? 0 : cycleDuration,
                                        repeat: reducedMotion ? 0 : Infinity,
                                        ease: "linear",
                                        times: [
                                            0,
                                            ((index - 1) * stepDuration + travelDuration) / cycleDuration,
                                            ((index - 1) * stepDuration + travelDuration + 0.45) / cycleDuration,
                                            resetStart / cycleDuration,
                                            resetEnd / cycleDuration,
                                            1,
                                        ],
                                    }}
                                />
                                <div className="relative z-10">
                                    <NodeDisplay node={node.node} />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            ))}
        </motion.div>
    )
}
