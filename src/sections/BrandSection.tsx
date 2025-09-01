import React from "react"

export const BrandSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full border-y border-white/10"}>
            <div className={""}/>

            <div className={"relative w-full flex flex-col gap-8 items-center justify-center py-12 border-x border-white/10"}>

                <div className="absolute mt-0.5 inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" />

                <p className={"text-xl text-white/75"}>Trusted by teams who want easy backends</p>
                <div className={"flex items-center justify-center gap-8 text-white/50"}>
                    <p className={"text-4xl font-bold"}>Logo1</p>
                    <p className={"text-4xl font-bold"}>Logo2</p>
                    <p className={"text-4xl font-bold"}>Logo3</p>
                    <p className={"text-4xl font-bold"}>Logo4</p>
                    <p className={"text-4xl font-bold"}>Logo5</p>
                </div>
            </div>

            <div className={""}/>
        </div>
    )
}
