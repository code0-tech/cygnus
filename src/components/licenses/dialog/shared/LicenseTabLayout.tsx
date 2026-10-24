"use client"

import { Alert, Button, Card, Flex, type Sizes, Spacing, Text } from "@code0-tech/pictor"
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
            <Spacing spacing={"md"} />
            {title ? (
                <>
                    <Text size="md" hierarchy="secondary">
                        {title}
                    </Text>
                    <Spacing spacing={"lg"} />
                </>
            ) : null}
            <Card color="secondary">{children}</Card>
        </>
    )
}

export function LicenseTabRow({
    action,
    children,
    className,
    contentSpacing = "xs",
    description,
    title,
    tone,
}: {
    action?: ReactNode
    children?: ReactNode
    className?: string
    contentSpacing?: Sizes
    description?: ReactNode
    title?: ReactNode
    tone?: "warning"
}) {
    const content = (
        <>
            {title || description || action ? (
                <Flex justify="space-between" align="center" style={{ gap: "1rem" }}>
                    <Flex align="center" style={{ gap: "0.75rem" }} className="min-w-0">
                        <Flex style={{ gap: "0.15rem", flexDirection: "column" }} className="min-w-0">
                            {title ? (
                                <Text size="md" hierarchy="primary">
                                    {title}
                                </Text>
                            ) : null}
                            {description ? (
                                <Text size="md" hierarchy="tertiary">
                                    {description}
                                </Text>
                            ) : null}
                        </Flex>
                    </Flex>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </Flex>
            ) : null}
            {children ? (
                <>
                    {title || description || action ? <Spacing spacing={contentSpacing} /> : null}
                    {children}
                </>
            ) : null}
        </>
    )

    return (
        <CardSection border className={className}>
            {tone === "warning" ? (
                <Alert color="warning" className="[&>div]:min-w-0 [&>div]:flex-1">
                    {content}
                </Alert>
            ) : (
                content
            )}
        </CardSection>
    )
}

export function LicenseTabAlert({ children }: { children: ReactNode }) {
    return (
        <>
            <Spacing spacing="xs" />
            <Alert color="error">{children}</Alert>
        </>
    )
}
