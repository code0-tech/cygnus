"use client"

import type { TeamMemberItem } from "@/lib/cms"
import type { Media } from "@/payload-types"
import { Card } from "@code0-tech/pictor"
import Image from "next/image"
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
    const { trigger } = useWebHaptics()
    const image = typeof member.image === "object" && member.image !== null ? (member.image as Media) : null
    const joinedAtLabel = member.joinedAt
        ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" }).format(new Date(member.joinedAt))
        : null

    return (
        <div
            onClick={() => trigger("medium")}>
            <Card variant="filled" className="bg-white/10! hover:bg-white/15! transition-all! h-full">
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
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        {member.role ? <p className="text-sm text-gray-400">{member.role}</p> : null}
                    </div>
                </div>

                {member.shortDescription ? <p className="text-white/80 mb-3">{member.shortDescription}</p> : null}
                {member.about ? <p className="text-sm text-white/65">{member.about}</p> : null}
                {joinedAtLabel ? <p className="text-xs text-white/50 mt-4">Joined: {joinedAtLabel}</p> : null}
            </Card>
        </div>
    )
}
