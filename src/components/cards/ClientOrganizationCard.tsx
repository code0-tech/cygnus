"use client"

import { Avatar, Card, Text } from "@code0-tech/pictor"

export function ClientOrganizationCard() {
    const organizations = ["Cygnus Labs", "Atlas Systems", "Nova Ops", "Orion Collective", "Pulse Ventures"]

    return (
        <Card className="relative mx-auto w-[90%] cursor-default self-start overflow-hidden pb-4 md:-mb-10 md:pb-10">
            <p className="mb-2 text-lg font-medium text-white/75">Organizations</p>
            <div className="mt-3 w-full overflow-hidden rounded-xl">
                {organizations.map((organization) => (
                    <div
                        key={organization}
                        className="flex items-center gap-3 border-b border-white/8 px-3 py-3 last:border-b-0"
                    >
                        <Avatar identifier={organization} />
                        <Text size="sm" className="text-white/85">
                            {organization}
                        </Text>
                    </div>
                ))}
            </div>
        </Card>
    )
}
