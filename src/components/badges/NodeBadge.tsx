"use client"

import { Badge, Text } from "@code0-tech/pictor"
import { IconNote } from "@tabler/icons-react"

export function NodeBadge({ value, color }: { value: string, color?: string }) {
    return (
        <Badge
            style={{ verticalAlign: "middle", textWrap: "nowrap" }}
            color={color ?? "primary"}
            border
            suppressHydrationWarning
        >
            <IconNote size={12}/>
            <Text size={"sm"} style={{color: "inherit"}}>
                {value}
            </Text>
        </Badge>
    )
}
