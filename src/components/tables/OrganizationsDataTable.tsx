"use client"

import { Avatar, Card, Text } from "@code0-tech/pictor"

export function OrganizationsDataTable() {
    const organizations = ["Cygnus Labs", "Atlas Systems", "Nova Ops", "Orion Collective", "Pulse Ventures"]

    return (
        <Card className="relative mx-auto w-[90%] max-h-62 self-start overflow-hidden -mb-10 pb-10 mask-[linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]">
            <p className="mb-2 text-lg font-medium text-white">Organizations</p>
            <p className="text-sm text-white/50">
                Manage organizations that you belong to. You can create new organizations and switch between them.
            </p>
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
