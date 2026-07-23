"use client"

import { ActionIcon } from "@/components/ActionIcon"
import type { ActionItem } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import Link from "next/link"
import { Card } from "../ui/Card"

export function ActionCard({ action, locale }: { action: ActionItem; locale: AppLocale | string }) {
    return (
        <Link href={`/${locale}/actions/${action.slug}`} className="block">
            <Card size="lg" variant="light" className="p-2! transition-colors hover:bg-white/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start gap-2">
                        {action.icon && (
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-primary text-white">
                                <ActionIcon icon={action.icon} size={28} />
                            </div>
                        )}

                        <div className="min-w-0 flex flex-col justify-center mt-1">
                            <h2 className="text-xl font-semibold leading-tight tracking-tight text-white">{action.title}</h2>
                            {action.shortDescription && <p className="mt-0.5 line-clamp-1 text-sm leading-6 text-secondary">{action.shortDescription}</p>}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
