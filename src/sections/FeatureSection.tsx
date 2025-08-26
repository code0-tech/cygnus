import React from "react"

export const FeatureSection: React.FC = () => {
    return (
        <div className={"w-full flex flex-col gap-8 my-40 px-[12%]"}>
            <div className={"flex items-center gap-2"}>
                <p className={"text-white text-3xl"}>Features</p>
            </div>

            <div className={"w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 auto-rows-fr"}>
                <div className={"bg-white/5 rounded-xl border border-white/10 h-[520px] col-span-2 row-span-2"}/>
                <div className={"bg-white/5 rounded-xl border border-white/10 col-span-2 row-span-2"}/>
                <div className={"bg-white/5 rounded-xl border border-white/10 col-span-3 row-span-2"}/>
                <div className={"bg-white/5 rounded-xl border border-white/10 col-span-1 row-span-2"}/>
            </div>
            <div className={"flex items-center gap-2"}>
                <p className={"text-white text-3xl"}>Try it out</p>
            </div>
            <div className={"h-[520px] w-full bg-white/5 rounded-xl border border-white/10"}/>
        </div>
    )
}