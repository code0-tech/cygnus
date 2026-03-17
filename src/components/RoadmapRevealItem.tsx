"use client"

import { m as motion } from "motion/react"
import React from "react"

interface RoadmapRevealItemProps {
    children: React.ReactNode
    delay?: number
}

export function RoadmapRevealItem({ children, delay = 0 }: RoadmapRevealItemProps) {
    return (
        <motion.div
            className="relative will-change-transform"
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration: 0.42,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            {children}
        </motion.div>
    )
}
