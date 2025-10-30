import React from "react"
import { AdapterCard } from "@/components/cards/AdapterCard"
import {ProjectCard} from "@/components/cards/ProjectCard"
import {RuntimeCard} from "@/components/cards/RuntimeCard"
import {SuggestionCard} from "@/components/cards/SuggestionCard"
import {useTranslations} from "next-intl"

export const FeatureSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full mt-0 border-y border-white/10"}>
            <div className={""}>
                <div className="h-full w-full relative text-white">
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                    repeating-linear-gradient(-40deg, 
                                      rgba(255, 255, 255, 0.05) 11px, 
                                      rgba(255, 255, 255, 0.05) 12px, 
                                      transparent 12px, 
                                      transparent 24px
                                    )
                                  `,
                        }}
                    />
                </div>
            </div>

            <div className={"w-full flex flex-col gap-8 border-x border-white/10 p-8"}>

                <div className={"w-full grid grid-cols-1 md:grid-cols-5 gap-16 auto-rows-fr"}>
                    <AdapterCard/>
                    <SuggestionCard/>
                    <RuntimeCard/>
                    <ProjectCard/>
                </div>

            </div>

            <div className={""}>
                <div className="h-full w-full relative text-white">
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                    repeating-linear-gradient(-40deg, 
                                      rgba(255, 255, 255, 0.05) 11px, 
                                      rgba(255, 255, 255, 0.05) 12px, 
                                      transparent 12px, 
                                      transparent 24px
                                    )
                                  `,
                        }}
                    />
                </div>
            </div>
        </div>

    )
}