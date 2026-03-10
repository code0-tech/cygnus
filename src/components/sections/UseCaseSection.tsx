"use client"

import { Section } from "@/components/ui/Section"
import { ANIMATION_PRESETS, type AnimationPreset } from "@/lib/utils"
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
                            <div className="mt-4 hidden w-1/2 px-2 pb-2 text-center md:block md:text-left">
                                <p className="text-xl font-semibold tracking-tight text-white md:text-3xl">{item.title}</p>
                                <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 md:text-base">{item.description}</p>
                                {item.bulletPoints?.length ? (
                                    <ul className="mt-5 space-y-2.5 text-sm text-white/80 md:text-base">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-point-${pointIndex}`} className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {item.actions?.length ? (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {item.actions.map((action, actionIndex) => (
                                            <span
                                                key={`${item.id ?? item.label}-action-${actionIndex}`}
                                                className="inline-flex items-center rounded-full border border-white/15 bg-white/4 px-3 py-1 text-xs text-white/85 backdrop-blur-md"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className="relative w-full md:w-2/3">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-10 -z-10 rounded-4xl bg-aqua/2 blur-2xl"
                                />
                                <div className="relative z-10 h-112 overflow-hidden rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_12px_40px_rgba(0,0,0,0.18)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/18 before:to-transparent before:content-['']">
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%)]" />
                                    <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-pink/6 blur-3xl" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-primary/70 via-primary/35 to-transparent" />
                                    {/* Flows darstellen */}
                                </div>
                            </div>
                            <div className="w-full px-2 pb-2 text-left md:hidden md:text-center">
                                <div className="mb-4 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                                    <span className="h-px w-8 bg-linear-to-r from-brand/70 to-transparent" />
                                    {item.label}
                                </div>
                                <p className="text-xl font-semibold tracking-tight text-white">{item.title}</p>
                                <p className="mt-3 text-sm leading-7 text-white/75">{item.description}</p>
                                {item.bulletPoints?.length ? (
                                    <ul className="mt-5 space-y-2.5 text-left text-sm text-white/80">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-mobile-point-${pointIndex}`} className="flex items-start gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {item.actions?.length ? (
                                    <div className="mt-5 flex flex-wrap gap-2 md:justify-center">
                                        {item.actions.map((action, actionIndex) => (
                                            <span
                                                key={`${item.id ?? item.label}-mobile-action-${actionIndex}`}
                                                className="inline-flex items-center rounded-full border border-white/15 bg-white/4 px-3 py-1 text-xs text-white/85 backdrop-blur-md"
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
