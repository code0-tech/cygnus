import React from "react"

export const DemoSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full"}>

            <div className={""}/>

            <div className={"flex flex-col gap-8 justify-center py-40 px-8"}>
                <div className={"w-2/3 flex flex-col gap-2"}>
                    <p className={"text-white/25 text-xl font-semibold"}>DEMO</p>
                    <p className={"text-white/75 text-2xl"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</p>
                </div>

                <div className={"h-[520px] w-full bg-white/2 rounded-xl border border-white/10"}/>
            </div>

            <div className={""}/>
        </div>
    )
}