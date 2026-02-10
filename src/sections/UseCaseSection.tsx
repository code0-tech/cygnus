"use client"

import { UseCaseCard } from "@/components/cards/UseCaseCard"
import { Section } from "@/components/Section"
import { cn } from "@/utils/cn"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import React, { useEffect, useRef, useState } from "react"

const useCases = ["CMS", "Workflow", "Bots"] as const;
type UseCase = typeof useCases[number];

export const UseCaseSection: React.FC = () => {
    const t = useTranslations('UseCaseSection')
    const [activeCase, setActiveCase] = useState<UseCase>("CMS")
    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })

    return (
        <Section translationKey="UseCaseSection">
            <div className={"w-full mx-auto flex flex-col items-center justify-center"}>
                <div className={"z-10 relative w-max h-full flex items-center -mb-6 p-2 rounded-2xl bg-[#353343] border border-white/5 shadow-md"}>
                    <div className={"flex items-center gap-2"}>
                        {useCases.map((item) => (
                            <UseCaseTab key={item}
                                title={item}
                                setPosition={setPosition}
                                selected={activeCase === item}
                                onClick={() => setActiveCase(item)}
                            />
                        ))}
                    </div>
                    <motion.div
                        animate={{...position}}
                        className={cn("absolute z-40 h-8 rounded-lg bg-white ring ring-white/20")}
                    />
                </div>
                <div className="flex w-full h-[600px] rounded-2xl bg-white/2 ring ring-white/5 shadow-lg">
                    {activeCase === "CMS" && (
                        <UseCaseCard title={t("useCase1Title")} description={t("useCase1Description")}/>
                    )}
                    {activeCase === "Workflow" && (
                        <UseCaseCard title={t("useCase2Title")} description={t("useCase2Description")}/>
                    )}
                    {activeCase === "Bots" && (
                        <UseCaseCard title={t("useCase3Title")} description={t("useCase3Description")}/>
                    )}
                </div>
            </div>
        </Section>
    )
}

interface UseCaseTabProps {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    onClick: () => void
    selected: boolean
    title: string
}

const UseCaseTab: React.FC<UseCaseTabProps> = ({ setPosition, onClick, title, selected }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (selected && ref.current) {
            const { width } = ref.current.getBoundingClientRect()
            setPosition({
                left: ref.current.offsetLeft,
                width,
                opacity: 1,
            })
        }
    }, [selected, setPosition])

    const moveHighlight = () => {
        if (!ref.current) return
        const { width } = ref.current.getBoundingClientRect()
        setPosition({
            left: ref.current.offsetLeft,
            width,
            opacity: 1,
        })
        onClick()
    }


    return (
        <motion.div
            className={cn(
                "relative z-50 flex items-center gap-2 px-4 py-1 font-medium text-md cursor-pointer transition-all",
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
