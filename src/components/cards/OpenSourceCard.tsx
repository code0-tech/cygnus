import {FlickeringGrid} from "@/components/FlickeringGrid"
import React from "react"

export const OpenSourceCard: React.FC = () => {
    return (
        <div className={"relative flex flex-col overflow-hidden gap-4 p-4 rounded-xl h-[520px] col-span-2 row-span-2"}>
            <FlickeringGrid
                className="relative h-2/3 inset-0 z-0 [mask-image:radial-gradient(240px_circle_at_center,white,transparent)]"
                squareSize={6}
                gridGap={4}
                color="#70ffb2"
                maxOpacity={0.5}
                flickerChance={0.1}
                height={800}
                width={800}
            >
            </FlickeringGrid>

            <div className={"absolute top-26 left-12 w-3/4 flex flex-col -space-y-4 z-10 shadow-2xl"}>
                <div className={"w-full h-14 rounded-xl bg-primary shadow-xl border border-white/10 z-[13]"}></div>
                <div className={"w-full h-14 rounded-xl bg-primary shadow-xl border border-white/10 z-[12]"}></div>
                <div className={"w-full h-14 rounded-xl bg-primary shadow-xl border border-white/10 z-[11]"}></div>
            </div>

            <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
        </div>
    )
}