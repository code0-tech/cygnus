"use client"

import { Badge, Text } from "@code0-tech/pictor";
import { IconVariable } from "@tabler/icons-react";

export function ReferenceBadge({ value }: { value: string }) {
    return (
        <Badge
            style={{ verticalAlign: "middle" }}
            color={"warning"}
            py={"0"}
            border
            suppressHydrationWarning
        >
            <IconVariable size={12}/>
            <Text size={"sm"} style={{color: "inherit"}}>
                {value}
            </Text>
        </Badge>
    )
}
