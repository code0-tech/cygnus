"use client"

import type { TeamMemberItem } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import { IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import { useState } from "react"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

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
    const imageUrl = getMediaUrl(image?.url)
    const cardLayoutId = `team-member-card-${member.id ?? member.name}`
    const joinedAtLabel = member.joinedAt ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" }).format(new Date(member.joinedAt)) : null
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
                <Card variant={"light"} size="lg" className="group h-full p-4! cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            {imageUrl ? (
                                <Image src={imageUrl} alt={image.alt ?? member.name} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                            ) : (
                                <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/80">{getInitials(member.name)}</div>
                            )}
                            <div>
                                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                                {member.role && <p className="text-sm text-white/75">{member.role}</p>}
                            </div>
                        </div>

                        {member.shortDescription && <p className="text-white/75 leading-6 mb-3">{member.shortDescription}</p>}
                        {joinedAtLabel && (
                            <p className="text-xs text-white/50 mt-4">
                                {joinedLabel}: {joinedAtLabel}
                            </p>
                        )}
                    </div>
                </Card>
            </motion.div>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div layoutId={cardLayoutId} className="w-full max-w-2xl max-h-[70vh]" onClick={(event) => event.stopPropagation()}>
                            <Card variant="light" className="bg-primary group h-full max-h-[80vh] overflow-y-auto p-4!">
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            {imageUrl ? (
                                                <Image src={imageUrl} alt={image.alt ?? member.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-base font-semibold text-white">{getInitials(member.name)}</div>
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-semibold text-white">{member.name}</h3>
                                                {member.role && <p className="text-sm text-white/75">{member.role}</p>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-lg p-1 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                                            aria-label={locale === "de" ? "Dialog schliessen" : "Close dialog"}
                                        >
                                            <IconX size={20} />
                                        </button>
                                    </div>

                                    {member.about && <p className="text-white/75 text-base">{member.about}</p>}
                                    {joinedAtLabel && (
                                        <p className="text-xs text-white/50 mt-6">
                                            {joinedLabel}: {joinedAtLabel}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    )
}
