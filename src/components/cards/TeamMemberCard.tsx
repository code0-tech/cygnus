"use client"

import type { TeamMemberItem } from "@/lib/cms"
import type { Media } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import { useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface TeamMemberCardProps {
    member: TeamMemberItem
    locale: string
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2)
    return parts.map((part) => part.charAt(0).toUpperCase()).join("")
}

export function TeamMemberCard({ member, locale }: TeamMemberCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { trigger } = useWebHaptics()

    const image = member.image as Media
    const cardLayoutId = `team-member-card-${member.id ?? member.name}`
    const joinedAtLabel = member.joinedAt
        ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" }).format(new Date(member.joinedAt))
        : null
    const joinedLabel = locale === "de" ? "Beigetreten" : "Joined"

    return (
        <>
            <motion.div
                layoutId={cardLayoutId}
                onClick={() => {
                    trigger("medium")
                    setIsOpen(true)
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        trigger("medium")
                        setIsOpen(true)
                    }
                }}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`${member.name} details`}
                whileTap={{ scale: 0.98 }}
            >
                <Card
                    variant="filled"
                    className="group relative h-full cursor-pointer overflow-hidden rounded-3xl! border! border-white/8! bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]! p-5! shadow-[0_18px_60px_rgba(0,0,0,0.35)]!"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
                    <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-aqua/14 blur-3xl transition-transform duration-700 group-hover:scale-115" />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-aqua/14 via-blue/6 to-transparent opacity-90" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-position-[center_center] bg-size-[32px_32px] mask-[linear-gradient(180deg,rgba(0,0,0,0.75),transparent_92%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(8,10,20,0),rgba(8,10,20,0.58)_58%,rgba(8,10,20,0.9))]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            {image?.url ? (
                                <Image
                                    src={image.url}
                                    alt={image.alt ?? member.name}
                                    width={56}
                                    height={56}
                                    className="h-14 w-14 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white/80">
                                    {getInitials(member.name)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-semibold tracking-tight text-white/92">{member.name}</h3>
                                {member.role ? <p className="text-sm text-white/50">{member.role}</p> : null}
                            </div>
                        </div>

                        {member.shortDescription ? <p className="text-white/80 leading-6 mb-3">{member.shortDescription}</p> : null}
                        {joinedAtLabel ? <p className="text-xs text-white/50 mt-4">{joinedLabel}: {joinedAtLabel}</p> : null}
                    </div>
                </Card>
            </motion.div>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            layoutId={cardLayoutId}
                            className="w-full max-w-2xl max-h-[70vh]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Card
                                variant="filled"
                                className="group relative overflow-hidden rounded-3xl! border! border-white/8! bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]! shadow-[0_18px_60px_rgba(0,0,0,0.35)]! h-full max-h-[80vh] overflow-y-auto p-6!"
                            >
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
                                <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-aqua/14 blur-3xl" />
                                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-aqua/14 via-blue/6 to-transparent opacity-90" />
                                <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-position-[center_center] bg-size-[32px_32px] mask-[linear-gradient(180deg,rgba(0,0,0,0.75),transparent_92%)]" />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(8,10,20,0),rgba(8,10,20,0.58)_58%,rgba(8,10,20,0.9))]" />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            {image?.url ? (
                                                <Image
                                                    src={image.url}
                                                    alt={image.alt ?? member.name}
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full bg-white/15 flex items-center justify-center text-base font-semibold text-white/80">
                                                    {getInitials(member.name)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-semibold tracking-tight text-white/92">{member.name}</h3>
                                                {member.role ? <p className="text-sm text-white/60">{member.role}</p> : null}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-lg p-1 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                            aria-label={locale === "de" ? "Dialog schliessen" : "Close dialog"}
                                        >
                                            <IconX size={20}/>
                                        </button>
                                    </div>

                                    {member.about ? <p className="text-white/80 leading-relaxed text-base">{member.about}</p> : null}
                                    {joinedAtLabel ? <p className="text-xs text-white/50 mt-6">{joinedLabel}: {joinedAtLabel}</p> : null}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    )
}
