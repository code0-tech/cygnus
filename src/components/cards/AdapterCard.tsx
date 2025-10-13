"use client"

import React from "react"
import dynamic from 'next/dynamic';

const PlayerWithNoSSR = dynamic(
    () => import('@lottielab/lottie-player/react').then(module => module.default),
    {ssr: false},
);

export const AdapterCard: React.FC = () => {
    return (
        <div className={"flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-3 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>

            <PlayerWithNoSSR
                autoplay
                loop
                style={{ height: '400px', width: '400px' }}
                src={'https://cdn.lottielab.com/l/7Y49BdSnCisP5m.json'}
            />

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/25"}>ADAPTERS</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>
        </div>
    )
}
