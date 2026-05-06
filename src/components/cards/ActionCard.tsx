"use client"

import type { ActionItem } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { AppLocale } from "@/lib/i18n"
import type { Media } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

export function ActionCard({ action, locale }: { action: ActionItem, locale: AppLocale | string }) {
    const { trigger } = useWebHaptics()
    const icon = action.icon as Media | undefined
    const iconUrl = getMediaUrl(icon?.url)

    return (
        <Link href={`/${locale}/actions/${action.slug}`} onClick={() => trigger("medium")} className="block">
            <Card variant="filled" className="glass-card-shell group p-2! hover:cursor-pointer">
                <div aria-hidden="true" className="glass-card-tint opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div aria-hidden="true" className="glass-card-topline opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        {iconUrl && (
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                <Image
                                    src={iconUrl}
                                    alt={icon?.alt ?? action.title}
                                    fill
                                    sizes="56px"
                                    className="object-contain p-2"
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1 mt-1">
                            <h2 className="text-lg font-semibold leading-tight tracking-tight text-white/92">{action.title}</h2>
                            {action.shortDescription && (
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">{action.shortDescription}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
