"use client"

import { Section } from "@/components/ui/Section"
import { ANIMATION_PRESETS, type AnimationPreset } from "@/utils/sectionAnimationPresets"
import { motion } from "motion/react"
import React from "react"

interface UseCaseItem {
    label: string
    title: string
    description: string
    bulletPoints: string[]
    actions: string[]
    id?: string | null
}

interface UseCaseSectionContent {
    useCases: UseCaseItem[] | null
}

interface UseCaseSectionProps {
    content?: UseCaseSectionContent | null
}

const USE_CASE_ANIMATION_SEQUENCE: Exclude<AnimationPreset, "none">[] = [
    "slide-left",
    "slide-right",
    "slide-left"
]

export const UseCaseSection: React.FC<UseCaseSectionProps> = ({ content }) => {
    if (!content?.useCases?.length) return null

    return (
        <Section sectionType="UseCaseSection" showBlur={false} animationPreset="none">
            <div className="relative w-full flex flex-col items-stretch gap-32">
                {content.useCases.map((item, index) => {
                    const animationPreset = USE_CASE_ANIMATION_SEQUENCE[index % USE_CASE_ANIMATION_SEQUENCE.length]
                    const animationConfig = ANIMATION_PRESETS[animationPreset]

                    return (
                        <motion.div
                            key={item.id ?? item.label}
                            className={`w-full flex flex-col items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                            initial={animationConfig.initial}
                            whileInView={animationConfig.whileInView}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                ...animationConfig.transition,
                                delay: index * 0.08,
                            }}
                        >
                            <div className="w-1/2 hidden md:block mt-4 px-2 pb-2 text-center md:text-left">
                                <p className="text-xl md:text-2xl font-semibold text-white">{item.title}</p>
                                <p className="mt-2 text-sm md:text-base text-white/75">{item.description}</p>
                                {item.bulletPoints?.length ? (
                                    <ul className="mt-4 space-y-2 text-sm md:text-base text-white/80 list-disc list-inside">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-point-${pointIndex}`}>{point}</li>
                                        ))}
                                    </ul>
                                ) : null}
                                {item.actions?.length ? (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {item.actions.map((action, actionIndex) => (
                                            <span
                                                key={`${item.id ?? item.label}-action-${actionIndex}`}
                                                className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs text-white/85"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className="relative w-2/3">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-16 -z-10 rounded-4xl bg-pink/5 blur-3xl"
                                />
                                <div className="relative z-10 h-112 rounded-2xl overflow-hidden bg-primary border border-white/10 shadow-md">
                                    {/* Flows darstellen */}
                                </div>
                            </div>
                            <div className="w-2/3 md:hidden px-2 pb-2 text-center">
                                <p className="text-xl font-semibold text-white">{item.title}</p>
                                <p className="mt-2 text-sm text-white/75">{item.description}</p>
                                {item.bulletPoints?.length ? (
                                    <ul className="mt-4 space-y-2 text-sm text-white/80 list-disc list-inside text-left">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-mobile-point-${pointIndex}`}>{point}</li>
                                        ))}
                                    </ul>
                                ) : null}
                                {item.actions?.length ? (
                                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                                        {item.actions.map((action, actionIndex) => (
                                            <span
                                                key={`${item.id ?? item.label}-mobile-action-${actionIndex}`}
                                                className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs text-white/85"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </Section>
    )
}
