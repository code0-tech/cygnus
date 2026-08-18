"use client"

import type { CheckoutData } from "@/lib/cms"
import { m as motion } from "motion/react"

interface CheckoutNextStepsProps {
    content?: CheckoutData["nextSteps"] | null
}

export function CheckoutNextSteps({ content }: CheckoutNextStepsProps) {
    if (!content) return null

    const steps = [
        { title: content.step1Title, description: content.step1Description },
        { title: content.step2Title, description: content.step2Description },
        { title: content.step3Title, description: content.step3Description },
    ]

    return (
        <div className="mb-6">
            <h2 className="text-2xl text-white">{content.heading}</h2>
            <ol className="relative mt-4 space-y-6">
                <div aria-hidden="true" className="pointer-events-none absolute left-3 top-2 h-[calc(100%-1.5rem)] w-px bg-linear-to-b from-white/20 via-white/10 to-transparent" />
                {steps.map((step, index) => (
                    <motion.li
                        key={step.title}
                        className="relative flex items-center gap-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.15, ease: "easeOut" }}
                    >
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-primary text-xs font-semibold text-white">
                            {index + 1}
                        </div>
                        <div className="">
                            <p className="text-sm font-medium text-white">{step.title}</p>
                            <p className="text-sm text-secondary">{step.description}</p>
                        </div>
                    </motion.li>
                ))}
            </ol>
        </div>
    )
}
