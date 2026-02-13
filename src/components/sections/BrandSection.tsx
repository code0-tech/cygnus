import React from "react"
import { Section } from "@/components/ui/Section"
import Image from "next/image"
import type { Media } from "@/payload-types"

interface BrandSectionLogo {
    logo: string | Media
    id?: string | null
}

interface BrandSectionContent {
    description?: string | null
    logos?: BrandSectionLogo[] | null
}

interface BrandSectionProps {
    content?: BrandSectionContent | null
}

export const BrandSection: React.FC<BrandSectionProps> = ({ content }) => {
    if (!content) return

    const logos = (content.logos ?? [])
        .map((item) => item.logo)
        .filter((logo): logo is Media => typeof logo !== "string" && Boolean(logo?.url))

    return (
        <Section showBlur={false} showFunnel={false}>
            <div className="w-full flex gap-8 px-8 md:px-16 pb-16 items-center justify-center">
                <p className={"hidden lg:flex text-md text-white/75"}>
                    {content.description}
                </p>
                <div className={"w-full grid grid-cols-2 md:grid-cols-4 gap-16 text-white/75 text-center"}>
                    {logos.length > 0 ? (
                        logos.map((logo, index) => (
                            <div className="relative w-full h-14" key={`${logo.id ?? logo.url ?? index}`}>
                                <Image
                                    src={logo.url ?? ""}
                                    alt={logo.alt}
                                    fill
                                    className="object-contain"
                                    sizes="(min-width: 768px) 20vw, 40vw"
                                />
                            </div>
                        ))
                    ) : (
                        <>
                            <p className={"text-4xl font-bold"}>Logo1</p>
                            <p className={"text-4xl font-bold"}>Logo2</p>
                            <p className={"text-4xl font-bold"}>Logo3</p>
                            <p className={"text-4xl font-bold"}>Logo4</p>
                        </>
                    )}
                </div>
            </div>
        </Section>
    )
}
