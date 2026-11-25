"use client"

import { ActionIcon } from "@/components/actions/ActionIcon"
import type { ActionItem } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { IconArrowUpRight } from "@tabler/icons-react"
import Link from "next/link"

/** Neutral fallback when an action has no brand colour (instead of the brand green). */
const NEUTRAL_ACCENT = "var(--color-secondary)"

/**
 * Square action tile in the house card style (light surface + 1px inset highlight).
 * The action's brand colour only shows as a soft glow in the top-left corner.
 */
export function ActionCard({ action, locale, categoryLabel }: { action: ActionItem; locale: AppLocale | string; categoryLabel?: string | null }) {
    const accent = action.brandColor1?.trim() || NEUTRAL_ACCENT

    return (
        <Link
            href={`/${locale}/actions/${action.slug}`}
            className="group relative isolate flex aspect-square flex-col overflow-hidden rounded-3xl bg-light p-4 shadow-[inset_0_1px_1px_#bfbfbf1a] transition-colors hover:bg-[#272532]"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 0% 0%, color-mix(in oklab, ${accent} 22%, transparent), transparent 55%)` }}
            />
            <IconArrowUpRight size={18} className="absolute top-4 right-4 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            <div className="flex flex-1 items-center justify-center">{action.icon && <ActionIcon icon={action.icon} size={80} />}</div>
            <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <h3 className="max-w-full truncate text-base font-bold text-white">{action.title}</h3>
                {categoryLabel && <span className="w-fit rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-secondary">{categoryLabel}</span>}
            </div>
        </Link>
    )
}

/** Loading placeholder matching ActionCard's size and layout. */
export function ActionCardSkeleton() {
    return (
        <div aria-hidden className="flex aspect-square animate-pulse flex-col rounded-3xl bg-light p-4 shadow-[inset_0_1px_1px_#bfbfbf1a]">
            <div className="flex flex-1 items-center justify-center">
                <div className="size-20 rounded-2xl bg-white/5" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
                <div className="my-1 h-4 w-2/3 rounded-full bg-white/8" />
                <div className="h-[19px] w-16 rounded-full bg-white/5" />
            </div>
        </div>
    )
}
