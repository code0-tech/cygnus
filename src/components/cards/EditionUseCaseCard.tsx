"use client"

import { cn } from "@/lib/utils"
import { Media } from "@/payload-types"
import Image from "next/image"
import { LinkButton } from "../ui/LinkButton"

interface EditionUseCaseCardProps {
    title: string
    description: string
    image?: Media | number | null
    link?: {
        label?: string | null
        url?: string | null
    } | null
    isFocused?: boolean
    className?: string
}

export function EditionUseCaseCard({ title, description, image, link, isFocused = false, className}: EditionUseCaseCardProps) {
    const imageUrl = typeof image === 'object' && image?.url ? image.url : null

    return (
        <div
            className={cn(
                "glass-card-shell group relative h-full rounded-[1.6rem] shadow-[0_14px_42px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.6rem-1px)] before:border before:border-white/6 before:content-['']",
                isFocused
                    ? "scale-100 opacity-100 z-10"
                    : "scale-90 opacity-40 blur-[2px]",
                className,
            )}
        >
            <div aria-hidden="true" className="glass-card-topline" />
            <div className="relative z-10 flex h-full flex-col items-stretch justify-start overflow-hidden rounded-[1.6rem]">
                {imageUrl ? (
                    <div className="relative h-48 w-full overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="relative h-48 w-full bg-white/5"/>
                )}

                <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-xl font-semibold text-white">
                        {title}
                    </h3>
                    <p className="mb-2 text-sm text-white/70 leading-relaxed">
                        {description}
                    </p>

                    {link?.url && link?.label && (
                        <LinkButton href={link.url}>
                            {link.label}
                        </LinkButton>
                    )}
                </div>
            </div>
        </div>
    )
}
