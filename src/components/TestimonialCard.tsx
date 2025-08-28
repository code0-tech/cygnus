import React from "react"
import Image from "next/image"

interface TestimonialCardProps {
    imageSrc: string
    name: string
    corporation: string
    text: string
    highlight?: string
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({imageSrc, name, corporation, text, highlight}) => {

    const renderText = () => {
        if (!highlight) return text

        const parts = text.split(new RegExp(`(${highlight})`, "gi")) // case-insensitive Split

        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <span key={i} className="text-[#70ffb2] font-semibold">
                    {part}
                </span>
            ) : (
                <span key={i}>{part}</span>
            )
        )
    }

    return (
        <div className={"flex flex-col bg-linear-to-tl from-white/3 to-primary rounded-xl shadow-xl border border-white/10 col-span-1"}>
            <div>
                <div className={"p-8 flex flex-col gap-4"}>
                    <p className="text-white/75 text-lg">{renderText()}</p>
                    <div className={"flex items-center gap-4 mt-4"}>
                        <Image src={imageSrc} alt={"Testimonial"} width={36} height={36} className={"rounded-full overflow-none aspect-square object-cover"}/>
                        <div className={"flex flex-col"}>
                            <p className={"text-white font-semibold"}>{name}</p>
                            <p className={"text-white/50 text-sm"}>{corporation}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
