"use client"

import { ActionIcon } from "@/components/ActionIcon"
import type { ActionItem } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import Link from "next/link"
import { Card } from "../ui/Card"

export function ActionCard({ action, locale }: { action: ActionItem; locale: AppLocale | string }) {
    const titleScale = Math.max(action.title.length * 0.58, 1)

    return (
        <Link href={`/${locale}/actions/${action.slug}`} className="block aspect-square w-full">
            <Card size="lg" variant="light" className="@container size-full p-4! transition-colors hover:bg-white/10">
                <div className="relative z-10 flex h-full min-w-0 flex-col items-center justify-center gap-4 text-center">
                    {action.icon && <ActionIcon icon={action.icon} size="clamp(3rem, 22cqi, 4rem)" />}
                    <h2 className="max-w-full whitespace-nowrap font-semibold leading-tight text-white" style={{ fontSize: `clamp(0.625rem, calc((100cqi - 2rem) / ${titleScale}), 1.25rem)` }}>
                        {action.title}
                    </h2>
                </div>
            </Card>
        </Link>
    )
}
