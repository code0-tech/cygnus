"use client"

import { UseCaseCard } from "@/components/cards/UseCaseCard"
import { Section } from "@/components/Section"
import { cn } from "@/utils/cn"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import React, { useEffect, useRef, useState } from "react"

const useCases = ["CMS", "Workflow", "Bots"] as const
type UseCase = typeof useCases[number]

export const UseCaseSection: React.FC = () => {
    const t = useTranslations('UseCaseSection')
    const [activeCase, setActiveCase] = useState<UseCase>("CMS")
    const [position, setPosition] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })
    const contentByCase: Record<UseCase, { title: string; description: string }> = {
        CMS: {
            title: t("useCase1Title"),
            description: t("useCase1Description")
        },
        Workflow: {
            title: t("useCase2Title"),
            description: t("useCase2Description")
        },
        Bots: {
            title: t("useCase3Title"),
            description: t("useCase3Description")
        }
    }
    const activeContent = contentByCase[activeCase]

    return (
        <Section translationKey="UseCaseSection">
            <div className={"w-full mx-auto flex flex-col items-center justify-center"}>
                <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
                    <div className={"z-10 relative w-full md:w-1/3 h-full flex md:flex-col items-center md:items-stretch p-2 rounded-2xl bg-[#353343] border border-white/5 shadow-md"}>
                        <div className={"relative w-full flex md:flex-col items-center md:items-stretch gap-2"}>
                            {useCases.map((item) => (
                                <UseCaseTab key={item}
                                    title={item}
                                    setPosition={setPosition}
                                    selected={activeCase === item}
                                    onClick={() => setActiveCase(item)}
                                />
                            ))}
                            <motion.div
                                animate={{...position}}
                                className={cn("absolute z-40 rounded-lg bg-white ring ring-white/20")}
                            />
                        </div>
                        <div className="mt-4 px-2 pb-2 text-center md:text-left">
                            <p className="text-xl md:text-2xl font-semibold text-white">{activeContent.title}</p>
                            <p className="mt-2 text-sm md:text-base text-white/75">{activeContent.description}</p>
                        </div>
                    </div>
                    <div className="flex w-full md:w-2/3 h-[600px] rounded-2xl bg-white/2 ring ring-white/5 shadow-lg">
                        <UseCaseCard />
                    </div>
                </div>
            </div>
        </Section>
    )
}

interface UseCaseTabProps {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; top: number; width: number; height: number; opacity: number }>>
    onClick: () => void
    selected: boolean
    title: string
}

const UseCaseTab: React.FC<UseCaseTabProps> = ({ setPosition, onClick, title, selected }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (selected && ref.current) {
            const { width, height } = ref.current.getBoundingClientRect()
            setPosition({
                left: ref.current.offsetLeft,
                top: ref.current.offsetTop,
                width,
                height,
                opacity: 1,
            })
        }
    }, [selected, setPosition])

    const moveHighlight = () => {
        if (!ref.current) return
        const { width, height } = ref.current.getBoundingClientRect()
        setPosition({
            left: ref.current.offsetLeft,
            top: ref.current.offsetTop,
            width,
            height,
            opacity: 1,
        })
        onClick()
    }


    return (
        <motion.div
            className={cn(
                "relative z-50 flex items-center justify-center md:justify-start gap-2 px-4 py-2 md:py-3 font-medium text-md cursor-pointer transition-all w-full",
                selected ? "text-black" : "text-white")}
            ref={ref}
            onClick={moveHighlight}
            initial={{opacity: 0, filter: 'blur(10px)'}}
            animate={{opacity: 1, filter: 'blur(0px)'}}
            transition={{duration: 0.65}}
        >
            {title}
        </motion.div>
    )
}
