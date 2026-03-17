"use client"

import {Badge, Text} from "@code0-tech/pictor"

export function LiteralBadge({ value }: { value: string }) {
    return (
        <Badge
            style={{ verticalAlign: "middle" }}
            color={"secondary"}
            suppressHydrationWarning
        >
            <Text size={"sm"}>
                {value}
            </Text>
        </Badge>
    )
}
