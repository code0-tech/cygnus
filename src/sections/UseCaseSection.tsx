"use client"

import React, {useEffect, useRef, useState} from "react"
import {UseCaseCard} from "@/components/cards/UseCaseCard"
import {useTranslations} from "next-intl"

export const UseCaseSection: React.FC = () => {
    const t = useTranslations('UseCaseSection')
    const [activeCard, setActiveCard] = useState(0)
    const [progress, setProgress] = useState(0)
    const mountedRef = useRef(true)

    useEffect(() => {
        const progressInterval = setInterval(() => {
            if (!mountedRef.current) return

            setProgress((prev) => {
                if (prev >= 100) {
                    if (mountedRef.current) {
                        setActiveCard((current) => (current + 1) % 3)
                    }
                    return 0
                }
                return prev + 2 // 2% every 100ms = 5 seconds total
            })
        }, 100)

        return () => {
            clearInterval(progressInterval)
            mountedRef.current = false
        }
    }, [])

    useEffect(() => {
        return () => {
            mountedRef.current = false
        }
    }, [])

    const handleCardClick = (index: number) => {
        if (!mountedRef.current) return
        setActiveCard(index)
        setProgress(0)
    }

    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full py-24"}>
                <div/>
                <div className={"w-full flex flex-col gap-16"}>
                    <div className={"w-full flex flex-col gap-4 items-center justify-center text-center"}>
                        <p className={"text-4xl lg:text-6xl text-white"}>
                            {t("title")}
                        </p>
                        <p className={"text-xl text-white/75"}>
                            {t("description")}
                        </p>
                    </div>
                    <div className={"w-full flex flex-col lg:flex-row gap-8"}>
                        <div className="flex lg:flex-col justify-center items-stretch gap-4">
                            <UseCaseCard
                                title={t("useCase1Title")}
                                description={t("useCase1Description")}
                                isActive={activeCard === 0}
                                progress={activeCard === 0 ? progress : 0}
                                onClick={() => handleCardClick(0)}
                            />
                            <UseCaseCard
                                title={t("useCase2Title")}
                                description={t("useCase2Description")}
                                isActive={activeCard === 1}
                                progress={activeCard === 1 ? progress : 0}
                                onClick={() => handleCardClick(1)}
                            />
                            <UseCaseCard
                                title={t("useCase3Title")}
                                description={t("useCase3Description")}
                                isActive={activeCard === 2}
                                progress={activeCard === 2 ? progress : 0}
                                onClick={() => handleCardClick(2)}
                            />
                        </div>
                        <div className="flex w-full h-56 lg:h-full rounded-lg bg-white/5 shadow-xl border border-white/10"/>
                    <div/>
                </div>
            </div>
        </div>

    )
}