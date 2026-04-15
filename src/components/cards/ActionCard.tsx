"use client"

import { ActionItem } from "@/lib/cms"
import { Media } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"

export function ActionCard({ action }: { action: ActionItem }) {
    const icon = action.icon as Media | undefined
    const references = (action.references ?? []).filter((reference): reference is Exclude<typeof reference, number> => typeof reference !== "number")
    const tags = (action.tags ?? []).filter((tag): tag is string => Boolean(tag))

    return (
        <Card variant="filled" className="glass-card-shell p-2!">
            <div aria-hidden="true" className="glass-card-tint" />
            <div aria-hidden="true" className="glass-card-topline" />

            <div className="relative z-10 flex flex-col gap-4 p-2">
                <div className="flex items-start gap-4">
                    {icon?.url ? (
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-primary/40">
                            <Image
                                src={icon.url}
                                alt={icon.alt ?? action.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                            />
                        </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold leading-tight tracking-tight text-white/92">{action.title}</h2>
                        {action.shortDescription ? (
                            <p className="mt-2 text-sm leading-6 text-white/70">{action.shortDescription}</p>
                        ) : null}
                    </div>
                </div>

                {action.documentation?.label && action.documentation?.url ? (
                    <div>
                        <Link
                            href={action.documentation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-aqua transition-opacity hover:opacity-80"
                        >
                            {action.documentation.label}
                        </Link>
                    </div>
                ) : null}

                {references.length ? (
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">References</p>
                        <div className="flex flex-wrap gap-2">
                            {references.map((reference) => (
                                <span
                                    key={reference.id}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                                >
                                    {reference.title}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </Card>
    )
}
