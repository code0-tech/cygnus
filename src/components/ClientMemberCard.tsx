"use client"

import { Avatar, Badge, Card, Text } from "@code0-tech/pictor"

export function ClientMemberCard() {
    return (
        <Card className="mx-auto w-[90%] shadow-md!">
            <div className="flex items-center gap-2">
                <Avatar identifier="Nico"/>
                <div>
                    <p className="text-base font-semibold text-white">@Nico</p>
                    <p className="text-sm text-white/75">nico@codezero.tech</p>
                </div>
                <Badge
                    color="info"
                    className="ml-auto align-middle"
                    suppressHydrationWarning
                >
                    <Text size="xs" style={{color: "inherit"}}>Maintainer</Text>
                </Badge>
            </div>
            <p className="text-xs mt-6 text-white/50">Member since: 2 months ago</p>
        </Card>
    )
}
