import React from "react"
import {InteractiveGridPattern} from "@/components/InteractiveGridPattern"
import {cn} from "@/utils/cn"

export const ContactSection: React.FC = () => {
    return (
        <div className={"relative overflow-hidden w-full flex flex-col items-center justify-center gap-8 py-20 border-y border-white/10"}>

            <InteractiveGridPattern
                className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]")}
                width={40}
                height={40}
                squares={[50, 10]}
            />

            <p className={"z-20 text-2xl text-white font-semibold"}>Build better backends with CodeZero</p>

            <div className={"z-20 flex items-center gap-4"}>
                <button className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                    Request a demo
                </button>
                <button className={"h-10 flex items-center gap-2 bg-primary hover:bg-[#1a1729] text-white/75 hover:text-white rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                    Contact
                </button>
            </div>

        </div>
    )
}