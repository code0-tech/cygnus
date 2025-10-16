import React from "react"

export const BrandSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full border-b border-white/10"}>
            <div className={""}/>

            <div className={"w-full flex flex-col gap-8 items-center justify-center text-center py-12 bg-transparent border-x border-white/10"}>
                <p className={"text-xl text-white/75"}>Trusted by teams who want easy backends</p>
                <div className={"flex items-center justify-center gap-4 lg:gap-24 text-white/75"}>
                    <p className={"text-4xl font-bold"}>Logo1</p>
                    <p className={"text-4xl font-bold"}>Logo2</p>
                    <p className={"text-4xl font-bold"}>Logo3</p>
                </div>
            </div>
            <div/>
        </div>
    )
}