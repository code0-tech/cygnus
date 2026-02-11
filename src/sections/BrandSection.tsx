import React from "react"
import { Section } from "@/components/Section"

export const BrandSection: React.FC = () => {
    return (
        <Section showBlur={false} showFunnel={false}>
            <div className="w-full flex gap-8 px-8 md:px-16 pb-16 items-center justify-center">
                <p className={"hidden lg:flex text-md text-white/75"}>
                    Titel
                </p>
                <div className={"w-full grid grid-cols-2 md:grid-cols-4 gap-16 text-white/75 text-center"}>
                    <p className={"text-4xl font-bold"}>Logo1</p>
                    <p className={"text-4xl font-bold"}>Logo2</p>
                    <p className={"text-4xl font-bold"}>Logo3</p>
                    <p className={"text-4xl font-bold"}>Logo4</p>
                </div>
            </div>
        </Section>
    )
}
