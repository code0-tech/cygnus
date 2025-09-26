import React from "react"
import {ChipLogo} from "@/components/ChipLogo"

export const RuntimeCard: React.FC = () => {
    return (
        <div className={"relative flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-3 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <div className={"relative flex justify-center items-center h-full w-full"}>
                <div className="absolute inset-10">
                    <div className="absolute inset-5 bg-[#70ffb2]/30 blur-[50px] rounded-lg" />
                    <div className="absolute inset-0 bg-[#70ffb2]/5 blur-[120px] rounded-lg" />
                </div>

                <ChipLogo/>
            </div>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/25"}>CODEZERO RUNTIME</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>

        </div>
    )
}