import React from "react"
import {cn} from "@/utils/cn"

interface UseCaseCardProps {
    title: string
    description: string
    isActive: boolean
    progress: number
    onClick: () => void
}

export const UseCaseCard: React.FC<UseCaseCardProps> = ({ title, description, isActive, progress, onClick }: UseCaseCardProps) => {
    return (
        <div
            className={cn(
                "w-full md:flex-1 self-stretch px-8 py-12 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative rounded-lg",
                isActive && "bg-white/5 border border-white/10"
            )}
            onClick={onClick}
        >
            {isActive && (
                <div className="absolute top-0 left-0 w-full h-1">
                    <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="self-stretch flex justify-center flex-col text-white text-xl font-semibold leading-6 md:leading-6 font-sans">
                {title}
            </div>
            <div className="self-stretch text-white/75 text-lg font-normal leading-[22px] md:leading-[22px] font-sans">
                {description}
            </div>
        </div>
    )
}