"use client"

import type { TeamMemberItem } from "@/lib/cms"
import { formatMediumDate } from "@/lib/formatters"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import { Dialog, DialogTrigger } from "@code0-tech/pictor"
import { SiteDialogContent } from "@/components/ui/SiteDialog"
import { m as motion } from "motion/react"
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
    const joinedAtLabel = member.joinedAt ? formatMediumDate(new Date(member.joinedAt), locale) : null
    const joinedLabel = locale === "de" ? "Beigetreten" : "Joined"

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.div
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
                    <Card variant={"light"} size="lg" className="group h-full p-4 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex flex-col relative z-10 gap-2">
                            <div className="flex items-center gap-4">
                                {imageUrl ? (
                                    <Image src={imageUrl} alt={image.alt ?? member.name} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                                ) : (
                                    <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-secondary">{getInitials(member.name)}</div>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                                    {member.role && <p className="text-sm text-secondary">{member.role}</p>}
                                </div>
                            </div>

                            {member.shortDescription && <p className="text-secondary leading-6">{member.shortDescription}</p>}
                            {joinedAtLabel && (
                                <p className="text-xs text-tertiary mt-2">
                                    {joinedLabel}: {joinedAtLabel}
                                </p>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </DialogTrigger>
            <SiteDialogContent title={member.name} description={member.role ?? undefined} closeLabel={locale === "de" ? "Dialog schliessen" : "Close dialog"}>
                {imageUrl ? (
                    <Image src={imageUrl} alt={image.alt ?? member.name} width={64} height={64} className="mb-6 h-16 w-16 rounded-full object-cover" />
                ) : (
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white">{getInitials(member.name)}</div>
                )}
                {member.about && <p className="text-base text-secondary">{member.about}</p>}
                {joinedAtLabel && (
                    <p className="mt-6 text-xs text-tertiary">
                        {joinedLabel}: {joinedAtLabel}
                    </p>
                )}
            </SiteDialogContent>
        </Dialog>
    )
}
