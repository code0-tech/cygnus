import React from "react"
import {TestimonialCard} from "@/components/TestimonialCard"

export const TestimonialSection: React.FC = () => {
    return (
        <div className={"w-full flex flex-col gap-8 py-40 px-[12%]"}>
            <div className={"flex items-center gap-2"}>
                <p className={"text-white text-3xl"}>Why our clients love code0</p>
            </div>

            <div className={"grid md:grid-cols-3 grid-cols-1 gap-16"}>
                <TestimonialCard/>
                <TestimonialCard/>
                <TestimonialCard/>
            </div>
        </div>

    )
}