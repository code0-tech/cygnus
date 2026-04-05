"use client"

import { useState } from "react"
import { Section } from "@/components/ui/Section"
import { Media } from "@/payload-types"
import { EditionUseCaseCard } from "@/components/cards/EditionUseCaseCard"
import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useWebHaptics } from "web-haptics/react"
import { m as motion, type Variants } from "motion/react"

interface EditionUseCaseItem {
    title: string
    description: string
    image?: Media | number | null
    link?: {
        label?: string | null
        url?: string | null
    } | null
    id?: string | null
}

interface EditionUseCaseSectionContent {
    heading: string
    subheading: string
    useCases: EditionUseCaseItem[] | null
}

interface EditionUseCaseSectionProps {
    content?: EditionUseCaseSectionContent | null
}

export function EditionUseCaseSection({ content }: EditionUseCaseSectionProps) {
    const [focusedIndex, setFocusedIndex] = useState(0)
    const { trigger } = useWebHaptics()

    if (!content?.heading || !content?.subheading || !content?.useCases?.length) return null

    const useCases = content.useCases

    const handlePrevious = () => {
        trigger("light")
        setFocusedIndex((prev) => (prev === 0 ? useCases.length - 1 : prev - 1))
    }

    const handleNext = () => {
        trigger("light")
        setFocusedIndex((prev) => (prev === useCases.length - 1 ? 0 : prev + 1))
    }

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.08,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 16 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    }

    const carouselVariants: Variants = {
        hidden: { opacity: 0, scale: 0.96 },
        show: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
            },
        },
    }

    return (
        <Section showBlur={false} animationPreset="none">
            <motion.div
                className="relative flex w-full flex-col items-stretch gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.div className="flex flex-col items-center gap-4 text-center" variants={staggerItem}>
                    <h2 className="text-4xl font-semibold text-white">
                        {content.heading}
                    </h2>
                    <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                        {content.subheading}
                    </p>
                </motion.div>

                <motion.div className="relative w-full" variants={carouselVariants}>
                    <div className="relative flex items-center justify-center gap-4 px-2 md:gap-8 md:px-16">
                        <Button
                            onClick={handlePrevious}
                            variant="filled"
                            className="absolute left-0 z-20 shrink-0 size-12! rounded-full! p-0!"
                            aria-label="Previous use case"
                        >
                            <IconChevronLeft className="size-6 mr-1" />
                        </Button>

                        <div className="relative flex w-full items-center justify-center px-0 md:px-2">
                            <div
                                className="relative flex w-full items-stretch justify-center"
                                style={{ minHeight: "400px" }}
                            >
                                {useCases.map((useCase, index) => {
                                    const offset = index - focusedIndex
                                    const isVisibleMobile = offset === 0
                                    const isVisibleDesktop = Math.abs(offset) <= 1

                                    return (
                                        <div
                                            key={useCase.id || index}
                                            className={cn(
                                                "absolute top-0 w-full transition-all duration-500 ease-out",
                                                "max-w-full md:max-w-md",
                                                !isVisibleMobile && "lg:opacity-100 lg:pointer-events-auto opacity-0 pointer-events-none",
                                                !isVisibleDesktop && "lg:opacity-0 lg:pointer-events-none"
                                            )}
                                            style={{
                                                transform: `translateX(${offset * 110}%)`,
                                            }}
                                        >
                                            <EditionUseCaseCard
                                                title={useCase.title}
                                                description={useCase.description}
                                                image={useCase.image}
                                                link={useCase.link}
                                                isFocused={index === focusedIndex}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <Button
                            onClick={handleNext}
                            variant="filled"
                            className="absolute left-0 z-20 shrink-0 size-12! rounded-full! p-0!"
                            aria-label="Next use case"
                        >
                            <IconChevronRight className="size-6 ml-1" />
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </Section>
    )
}
