"use client"

import {cn} from "@/lib/utils"
import {Media} from "@/payload-types"
import Image from "next/image"
import {LinkButton} from "../ui/LinkButton"

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

export function EditionUseCaseCard({
                                       title,
                                       description,
                                       image,
                                       link,
                                       isFocused = false,
                                       className
                                   }: EditionUseCaseCardProps) {
    const imageUrl = typeof image === 'object' && image?.url ? image.url : null

    return (
        <div
            className={cn(
                "glass-card-shell group relative flex h-full min-h-0 flex-col rounded-3xl transition-all duration-500 ease-out before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.6rem-1px)] before:border before:border-white/6 before:content-['']",
                className
            )}
        >
            <div aria-hidden="true" className="glass-card-topline"/>
            <div
                className="relative flex h-full flex-col items-stretch justify-start overflow-hidden rounded-[1.6rem]">
                <div className={"p-2"}>
                    {imageUrl ? (
                        <div
                            className="relative overflow-hidden aspect-video w-full rounded-2xl border border-white/8 bg-primary/40">
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                sizes="(min-width: 768px) 66vw, 100vw"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full aspect-video bg-white/5 rounded-2xl"/>
                    )}
                </div>


                <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 text-xl font-semibold text-white">
                        {title}
                    </h3>
                    <p className="mb-2 text-sm text-white/70 leading-relaxed">
                        {description}
                    </p>

                    {link?.url && link?.label && (
                        <div className="mt-auto pt-2">
                            <LinkButton href={link.url} className="my-2">
                                {link.label}
                            </LinkButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
