import React from "react"
import Image from "next/image"

export const QuoteSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full border-y border-white/10"}>
            <div className={""}/>

            <div className={"relative w-full flex flex-col p-8 gap-4 items-center justify-center pt-16 pb-8 border-x border-white/10"}>

                <div className="absolute mt-0.5 inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" />

                <p className={"text-white/75 text-2xl"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</p>

                <div className={"w-full flex items-center gap-4 justify-end"}>
                    <Image src={"/testimonial1.png"} alt={"Testimonial"} width={24} height={24} className={"rounded-full overflow-none aspect-square object-cover"}/>
                    <p className={"text-white/50"}>Nico Sammito, CEO</p>
                </div>

            </div>

            <div className={""}/>
        </div>
    )
}
