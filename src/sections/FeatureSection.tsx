import React from "react"
import { OpenSourceCard } from "@/components/cards/OpenSourceCard"

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

            <div className={"w-full flex flex-col gap-8 border-x border-white/10 pt-20 pb-8 px-8"}>
                <div className={"w-2/3 flex flex-col gap-2"}>
                    <p className={"text-white/25 text-xl font-semibold"}>FEATURES</p>
                    <p className={"text-white/75 text-2xl"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</p>
                </div>

                <div className={"w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 auto-rows-fr"}>
                    <OpenSourceCard />
                    <div className={"bg-white/2 rounded-xl border border-white/10 col-span-3 row-span-2"}/>
                    <div className={"bg-white/2 rounded-xl border border-white/10 col-span-3 row-span-2"}/>
                    <div className={"bg-white/2 rounded-xl border border-white/10 col-span-2 row-span-2"}/>
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