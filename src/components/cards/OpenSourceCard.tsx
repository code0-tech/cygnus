"use client"

import {FlickeringGrid} from "@/components/FlickeringGrid"
import React, {useEffect, useRef, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {IconGitCommit, IconGitMerge, IconGitPullRequest} from "@tabler/icons-react"
import {cn} from "@/utils/cn"

export const OpenSourceCard: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null)

    return (
        <div className={"relative flex flex-col justify-between overflow-hidden gap-4 p-4 h-[420px] col-span-1 md:col-span-2 lg:col-span-4 row-span-2 bg-white/1 rounded-xl border border-white/10"} ref={cardRef}>
            <FlickeringGrid
                className="relative inset-0 z-0 [mask-image:radial-gradient(205px_circle_at_center,white,transparent)]"
                squareSize={6}
                gridGap={4}
                color="#70ffb2"
                maxOpacity={0.5}
                flickerChance={0.1}
                height={260}
                width={cardRef.current?.clientWidth}
            />
            <div className={"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 w-4/5"}>
                <MergeCard />
            </div>
            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/25"}>OPEN SOURCE</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>
        </div>
    )
}

const MergeCard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentStep < 3) setCurrentStep((s) => s + 1)
            else setCurrentStep(0)
        }, 2000)
        return () => clearTimeout(timer)
    }, [currentStep])

    return (
        <div className="relative w-full h-32 overflow-hidden">
            <AnimatePresence mode="wait">
                {currentStep >= 0 && currentStep !== 3 && (
                    <motion.div
                        key={"commit"}
                        className={cn("absolute inset-0 h-max p-2 bg-primary rounded-xl shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.5)] border border-white/10 z-[11]", currentStep === 1 && "scale-95", currentStep === 2 && "scale-90")}
                        initial={{ y: 120, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -40, opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        <div className={"h-full flex items-center gap-1"}>
                            <IconGitCommit size={26} className={"text-[#575562] mr-1"}/>
                            <p className={"text-white/75 font-mono"}>Marius</p>
                            <p className={"text-white/50"}>commited to Code0</p>
                        </div>
                    </motion.div>
                )}
                {currentStep >= 1 && currentStep !== 3 && (
                    <motion.div
                        key={"pr"}
                        className={cn("absolute inset-0 h-max p-2 bg-primary rounded-xl shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.5)] border border-white/10 z-[12]", currentStep === 2 && "scale-95")}
                        initial={{ y: 120, opacity: 0, scale: 0.8 }}
                        animate={{ y: 10, opacity: 1, scale: 1 }}
                        exit={{ y: -40, opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        <div className={"h-full flex items-center gap-1"}>
                            <IconGitPullRequest size={26} className={"text-[#575562] mr-1"}/>
                            <p className={"text-white/75 font-mono"}>Marius</p>
                            <p className={"text-white/50"}>sent a pull request</p>
                        </div>
                    </motion.div>
                )}
                {currentStep === 2 && (
                    <motion.div
                        key={"merge"}
                        className={"absolute inset-0 h-max p-2 bg-primary rounded-xl shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.5)] border border-white/10 z-[13]"}
                        initial={{ y: 120, opacity: 0, scale: 0.8 }}
                        animate={{ y: 20, opacity: 1, scale: 1 }}
                        exit={{ y: -40, opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        <div className={"h-full flex items-center gap-1"}>
                            <IconGitMerge size={26} className={"text-[#575562] mr-1"}/>
                            <p className={"text-white/75 font-mono"}>Nico</p>
                            <p className={"text-white/50"}>merged Pull Request #132</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}