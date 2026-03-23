"use client"

import { Avatar, Card, Text } from "@code0-tech/pictor"
import { StableBadge } from "../ui/StableBadge"

export function ClientMemberCard() {
    return (
        <Card className="mx-auto w-[90%] shadow-md! cursor-default">
            <div className="flex items-center gap-2">
                <Avatar identifier="Nico"/>
                <div>
                    <p className="text-base font-semibold text-white">@Nico</p>
                    <p className="text-xs lg:text-sm text-white/75">nico@codezero.tech</p>
                </div>
                <StableBadge
                    color="info"
                    className="hidden lg:flex ml-auto align-middle"
                >
                    <Text size="xs" style={{color: "inherit"}}>Maintainer</Text>
                </StableBadge>
            </div>
            <p className="text-xs mt-6 text-white/50">Member since: 2 months ago</p>
        </Card>
    )
}
