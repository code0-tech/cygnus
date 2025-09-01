import React from "react"
import {InteractiveGridPattern} from "@/components/InteractiveGridPattern"
import {cn} from "@/utils/cn"
import Image from "next/image"

export const ContactSection: React.FC = () => {
    return (
        <div className={"relative overflow-hidden w-full flex flex-col items-center justify-center gap-8 pt-8 pb-12 border-y border-white/10"}>

            <InteractiveGridPattern
                className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]")}
                width={42}
                height={48}
                squares={[50, 10]}
            />

            <Image src={"/code0_logo.png"} width={"112"} height={"112"} alt={"Code0 Logo"} className={"z-20 shadow-2xl"}/>

            <p className={"z-20 text-4xl text-white font-semibold"}>Build better backends with CodeZero</p>
            <p className={"w-1/2 z-20 text-lg text-white/75 text-center"}>
                The backend world gets to the next era with the code0 no-code platform.
                From database modelling to scalable backend endpoints in no-time.
            </p>

            <div className={"z-20 flex items-center gap-4"}>
                <button className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                    Request a demo
                </button>
            </div>

        </div>
    )
}