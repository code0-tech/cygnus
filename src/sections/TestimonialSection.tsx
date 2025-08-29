import React from "react"
import {TestimonialCard} from "@/components/TestimonialCard"

export const TestimonialSection: React.FC = () => {
    return (
        <div className={"w-full flex flex-col gap-8 pt-40 px-[12%]"}>
            <div className={"flex items-center gap-2"}>
                <p className={"text-white text-3xl"}>Why our clients love code0</p>
            </div>

            <div className={"grid md:grid-cols-3 grid-cols-1 gap-16"}>
                <TestimonialCard imageSrc={"/testimonial3.png"} name={"Raphael Goetz"} corporation={"CEO, Lorem ipsum gmbh"} highlight={"stunning website"} text={"CodeZero transformed our online presence with a stunning website that truly reflects our brand. Their team was professional, creative, and easy to work with. Highly recommend!"}/>
                <TestimonialCard imageSrc={"/testimonial1.png"} name={"Marius Ahsmus"} corporation={"CEO, Lorem ipsum gmbh"} highlight={"stunning website"} text={"CodeZero transformed our online presence with a stunning website that truly reflects our brand. Their team was professional, creative, and easy to work with. Highly recommend!"}/>
                <TestimonialCard imageSrc={"/testimonial2.png"} name={"Nico Sammito"} corporation={"CEO, Lorem ipsum gmbh"} highlight={"stunning website"} text={"CodeZero transformed our online presence with a stunning website that truly reflects our brand. Their team was professional, creative, and easy to work with. Highly recommend!"}/>
            </div>
        </div>

    )
}