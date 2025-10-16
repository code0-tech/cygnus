"use client"

import React from "react"

export const SuggestionCard: React.FC = () => {
    return (
        <div className={"flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-2 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>SUGGESTION LOGIC</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>
        </div>
    )
}
