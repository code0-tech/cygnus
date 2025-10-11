import React from "react"
import Dither from "@/components/Dither"

export const HeroSection: React.FC = () => {
    const base = [0.4392, 1.0000, 0.7020] as [number, number, number]
    const accent = [0.1, 0.2, 1] as [number, number, number]

    return (
        <div className="relative h-screen flex flex-col p-[5%] gap-24 overflow-hidden">
            <div className="relative h-full flex flex-col justify-center items-center gap-8 rounded-xl bg-brand/50 border border-brand/50 py-32 px-16 overflow-hidden shadow-lg">
                <div className={"absolute inset-0 opacity-50"}>
                    <Dither
                        baseColor={base}
                        waveColor={accent}
                        disableAnimation={false}
                        enableMouseInteraction={true}
                        mouseRadius={0.3}
                        colorNum={4}
                        waveAmplitude={0.3}
                        waveFrequency={3}
                        waveSpeed={0.03}
                    />
                </div>

                <div className="relative z-10 bg-brand/50 cursor-pointer border border-white/10 text-white shadow-md w-fit px-4 py-0.5 rounded-full flex items-center gap-1 text-sm font-medium">
                    v01.0-alpha
                </div>

                <h1 className="relative z-10 font-bold text-6xl text-white text-center">
                    Build complex backends in no time
                </h1>

                <p className="relative z-10 text-center font-medium text-white/75 text-xl">
                    The backend world gets to the next era with the code0 no-code platform. <br />
                    From database modelling to scalable backend endpoints in no-time.
                </p>

                <button className="h-12 z-10 flex items-center justify-center text-lg gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md">
                    Start building
                </button>
            </div>
        </div>
    )
}