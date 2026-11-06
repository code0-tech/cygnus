"use client"

import { Alert, type AlertProps, Flex, Text } from "@code0-tech/pictor"
import type { ReactNode } from "react"

interface LicenseAlertProps {
    action?: ReactNode
    color?: AlertProps["color"]
    description?: ReactNode
}

// Alert ships its own icon, role and aria-live, so this only lays out the message next to its action.
export function LicenseAlert({ action, color = "warning", description }: LicenseAlertProps) {
    return (
        <Alert color={color}>
            <Flex justify="space-between" align="center" style={{ gap: "1rem" }} className="min-w-0 flex-1">
                {description ? (
                    <Text size="md" hierarchy="secondary" className="min-w-0">
                        {description}
                    </Text>
                ) : null}
                {action}
            </Flex>
        </Alert>
    )
}
