"use client"

import { Button, Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import CardSection from "@code0-tech/pictor/dist/components/card/CardSection"
import { cn } from "@/lib/utils"
import type { ComponentProps, ReactNode } from "react"

export function LicenseTabHeader({ action, description, title }: { action?: ReactNode; description?: ReactNode; title: ReactNode }) {
    return (
        <>
            <Flex justify="space-between" align="center" style={{ gap: "1rem" }}>
                <Text hierarchy="primary" display="block" className="text-[22px]! leading-tight!">
                    {title}
                </Text>
                {action}
            </Flex>
            {description ? (
                <Text size="md" hierarchy="tertiary" className="mt-1!">
                    {description}
                </Text>
            ) : null}
        </>
    )
}

export function LicenseTabSaveButton(props: Omit<ComponentProps<typeof Button>, "color" | "paddingSize" | "variant">) {
    return <Button type="button" {...props} paddingSize="xxs" color="success" variant="none" className={cn("rounded-2xl!", props.className)} />
}

export function LicenseTabSection({ children, title }: { children: ReactNode; title?: ReactNode }) {
    return (
        <>
            <Spacing spacing="xl" />
            {title ? (
                <>
                    <Text size="md" hierarchy="secondary">
                        {title}
                    </Text>
                    <Spacing spacing="md" />
                </>
            ) : null}
            <Card color="secondary">{children}</Card>
        </>
    )
}

export function LicenseTabRow({ action, children, description, title }: { action?: ReactNode; children?: ReactNode; description?: ReactNode; title?: ReactNode }) {
    return (
        <CardSection border>
            {title || description || action ? (
                <Flex justify="space-between" align="center" style={{ gap: "1rem" }}>
                    <Flex style={{ gap: "0.15rem", flexDirection: "column" }} className="min-w-0">
                        {title ? (
                            <Text size="md" hierarchy="primary">
                                {title}
                            </Text>
                        ) : null}
                        {description ? (
                            <Text size="sm" hierarchy="tertiary">
                                {description}
                            </Text>
                        ) : null}
                    </Flex>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </Flex>
            ) : null}
            {children ? (
                <>
                    {title || description || action ? <Spacing spacing="xs" /> : null}
                    {children}
                </>
            ) : null}
        </CardSection>
    )
}

export function LicenseTabAlert({ children }: { children: ReactNode }) {
    return (
        <>
            <Spacing spacing="xs" />
            <Text role="alert" size="sm" className="text-error!">
                {children}
            </Text>
        </>
    )
}
