"use client"

import {cn} from "@/lib/utils"
import { getMediaUrl } from "@/lib/media"
import {Media} from "@/payload-types"
import Image from "next/image"
import {LinkButton} from "../ui/LinkButton"

interface SwipeCardProps {
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

export function SwipeCard({ title, description, image, link, className }: SwipeCardProps) {
    const imageUrl = typeof image === 'object' ? getMediaUrl(image?.url) : ""

    return (
        <div
            className={cn(
                "glass-card-shell group relative flex flex-col rounded-3xl transition-all duration-500 ease-out before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.5rem-1px)] before:border before:border-white/6 before:content-['']",
                className
            )}
        >
            <div aria-hidden="true" className="glass-card-topline"/>
            <div
                className="relative flex flex-col items-stretch justify-start rounded-2xl">
                <div className={"p-2"}>
                    {imageUrl ? (
                        <div
                            className="relative overflow-hidden aspect-video w-full rounded-2xl border border-white/10 bg-primary/50">
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


                <div className="flex flex-col gap-2 p-3 sm:p-4">
                    <h3 className="line-clamp-2 flex-none text-lg font-semibold leading-[1.35] text-white sm:text-xl">
                        {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/75">
                        {description}
                    </p>

                    {link?.url && link?.label && (
                        <div className="min-w-0 flex-none pt-1">
                            <LinkButton href={link.url} className="max-w-full min-w-0">
                                <span className="min-w-0 truncate">
                                    {link.label}
                                </span>
                            </LinkButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
