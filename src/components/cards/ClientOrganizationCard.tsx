"use client"

import { Avatar, Text } from "@code0-tech/pictor"
import { Card } from "../ui/Card"

const ORGANIZATIONS = ["Cygnus Labs", "Atlas Systems", "Nova Ops", "Orion Collective", "Pulse Ventures"]

export function ClientOrganizationCard() {
    return (
        <Card className="mx-auto w-[90%] self-start md:-mb-10 md:pb-10 bg-primary">
            <p className="mb-2 text-lg font-medium text-secondary">Organizations</p>
            <div className="mt-3 w-full overflow-hidden rounded-xl">
                {ORGANIZATIONS.map((organization) => (
                    <div key={organization} className="flex items-center gap-3 border-b border-white/8 px-3 py-3 last:border-b-0">
                        <Avatar identifier={organization} />
                        <Text size="sm" className="text-secondary">
                            {organization}
                        </Text>
                    </div>
                ))}
            </div>
        </Card>
    )
}
