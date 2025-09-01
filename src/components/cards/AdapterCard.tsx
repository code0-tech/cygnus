"use client"

import React, {useRef} from "react"
import {AnimatedBeam} from "@/components/AnimatedBeam"

export const AdapterCard: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const div1Ref = useRef<HTMLDivElement>(null)
    const div2Ref = useRef<HTMLDivElement>(null)
    const div3Ref = useRef<HTMLDivElement>(null)
    const div4Ref = useRef<HTMLDivElement>(null)

    return (
        <div className={"relative flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-3 row-span-2 bg-white/1 rounded-xl border border-white/10"}>

            <div className={"relative w-3/4 h-full flex items-center justify-between"} ref={containerRef}>
                <div className={"flex flex-col items-center gap-4"}>
                    <div className={"z-10 w-32 h-18 flex items-center justify-center font-bold text-white/75 text-2xl rounded-xl bg-primary border border-white/10 ring-3 ring-white/3 shadow-xl"} ref={div1Ref}>
                        HTTP
                    </div>
                    <div className={"z-10 w-32 h-18 flex items-center justify-center font-bold text-white/75 text-2xl rounded-xl bg-primary border border-white/10 ring-3 ring-white/3 shadow-xl"} ref={div2Ref}>
                        MQTT
                    </div>
                    <div className={"z-10 w-32 h-18 flex items-center justify-center font-bold text-white/75 text-2xl rounded-xl bg-primary border border-white/10 ring-3 ring-white/3 shadow-xl"} ref={div3Ref}>
                        AMQP
                    </div>
                </div>

                <div className={"z-10 w-40 h-20 flex items-center justify-center font-bold text-2xl text-white rounded-xl bg-[#080c1c] border border-[#70ffb2]/20 ring-3 ring-[#70ffb2]/10 shadow-xl"} ref={div4Ref}>
                    CodeZero
                </div>

                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={div1Ref}
                    toRef={div4Ref}
                    curvature={30}
                    endXOffset={-30}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={div2Ref}
                    toRef={div4Ref}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={div3Ref}
                    toRef={div4Ref}
                    curvature={-30}
                    endXOffset={-30}
                />
            </div>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/25"}>ADAPTERS</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>
        </div>
    )
}
