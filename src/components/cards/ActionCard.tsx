"use client"

import type { ActionItem } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { AppLocale } from "@/lib/i18n"
import type { Media } from "@/payload-types"
import Image from "next/image"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

export function ActionCard({ action, locale }: { action: ActionItem; locale: AppLocale | string }) {
    const { trigger } = useWebHaptics()
    const icon = action.icon as Media | undefined
    const iconUrl = getMediaUrl(icon?.url)

    return (
        <Link href={`/${locale}/actions/${action.slug}`} onClick={() => trigger("medium")} className="block">
            <Card size="lg" variant="light" className="p-2! transition-colors hover:bg-white/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        {iconUrl && (
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-white/5">
                                <Image src={iconUrl} alt={icon?.alt ?? action.title} fill sizes="56px" className="object-contain p-2" />
                            </div>
                        )}

                        <div className="min-w-0 flex-1 mt-1">
                            <h2 className="text-lg font-semibold leading-tight tracking-tight text-white">{action.title}</h2>
                            {action.shortDescription && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/75">{action.shortDescription}</p>}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
