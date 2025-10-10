import React from "react"
import Image from "next/image"

export const QuoteSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[20%_60%_20%] w-full py-24"}>
            <div className={""}/>

            <div className={"w-full flex flex-col gap-4 items-center justify-center pt-16 pb-8 "}>
                <p className={"text-white/75 text-md sm:text-xl lg:text-4xl"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</p>

                <div className={"w-full flex items-center gap-4"}>
                    <Image src={"/testimonial1.png"} alt={"Testimonial"} width={24} height={24} className={"rounded-full overflow-none aspect-square object-cover"}/>
                    <p className={"text-white/50 text-xl"}>Nico Sammito, CEO</p>
                </div>

            </div>

            <div className={""}/>
        </div>
    )
}
