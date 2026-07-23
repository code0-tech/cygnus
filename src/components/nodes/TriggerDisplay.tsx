"use client"

import { Card, Flex, Text } from "@code0-tech/pictor"
import type { ReactNode } from "react"

export interface TriggerDisplayProps {
    icon: ReactNode
    text: string
}

export function TriggerDisplay({ icon, text }: TriggerDisplayProps) {
    return (
        <Flex align="center" className="relative z-10 min-w-44 shrink-0 flex-col" style={{ gap: "0.7rem" }}>
            <Card
                variant="normal"
                color="secondary"
                paddingSize="xs"
                display="flex"
                align="center"
                justify="center"
                className="border-white/10 shadow-lg shadow-black/20"
                style={{
                    aspectRatio: "1 / 1",
                    height: "60px",
                    minHeight: "60px",
                    minWidth: "60px",
                    transform: "rotate(45deg)",
                    width: "60px",
                }}
            >
                <span className="flex items-center justify-center text-brand" style={{ transform: "rotate(-45deg)" }}>
                    {icon}
                </span>
            </Card>
            <Text size="xs" style={{ textAlign: "center", width: "200px" }} className="font-medium text-secondary!">
                {text}
            </Text>
        </Flex>
    )
}
