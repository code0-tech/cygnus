"use client"

import type { LicenseProject } from "@/components/licenses/LicenseSidebar"
import type { LicenseData } from "@/lib/cms"
import {
    Badge,
    Card,
    Col,
    Flex,
    Row,
    Spacing,
    Text,
} from "@code0-tech/pictor"
import { IconCreditCard, IconFileInvoice, IconKey, IconReceipt, IconStack2 } from "@tabler/icons-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface LicenseDashboardPageProps {
    content: LicenseData
    locale: "de" | "en"
    projects?: LicenseProject[]
}

const dashboardCopy = {
    de: {
        description: "Verwalte deine Projekte und die ihnen zugeordneten Lizenzen.",
        emptyDescription: "Sobald einem Projekt eine Lizenz zugeordnet wurde, erscheint es hier.",
        emptyTitle: "Noch keine Lizenzen vorhanden",
        licenses: "Lizenzen",
        projects: "Projekte",
    },
    en: {
        description: "Manage your projects and the licenses assigned to them.",
        emptyDescription: "Projects will appear here as soon as a license has been assigned to them.",
        emptyTitle: "No licenses yet",
        licenses: "licenses",
        projects: "Projects",
    },
} as const

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <Flex style={{ flex: 1, minWidth: 0, flexDirection: "column", gap: "0.7rem" }}>
            <Flex align="center" justify="space-between" style={{ gap: "0.5rem" }}>
                <Text size="sm" hierarchy="tertiary">
                    {label}
                </Text>
                <span className="text-tertiary">{icon}</span>
            </Flex>
            <Text fz={3} fw={600} style={{ lineHeight: 0.9 }}>
                {value}
            </Text>
        </Flex>
    )
}

export function LicenseDashboardPage({ content, locale, projects = [] }: LicenseDashboardPageProps) {
    const copy = dashboardCopy[locale]
    const licenseCount = projects.reduce((total, project) => total + project.licenseCount, 0)
    const metrics = [
        { icon: <IconKey aria-hidden="true" size={14} />, label: content.cards.licenses, value: licenseCount },
        { icon: <IconReceipt aria-hidden="true" size={14} />, label: content.cards.subscriptions, value: 0 },
        { icon: <IconCreditCard aria-hidden="true" size={14} />, label: content.cards.paymentProfiles, value: 0 },
        { icon: <IconFileInvoice aria-hidden="true" size={14} />, label: content.cards.invoices, value: 0 },
    ]

    return (
        <>
            <Card color="secondary">
                <Flex align="center">
                    {metrics.map((metric, index) => (
                        <div key={metric.label} className="contents">
                            <Metric {...metric} />
                            {index < metrics.length - 1 && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: 1,
                                        alignSelf: "stretch",
                                        background: "rgba(255,255,255,0.08)",
                                        margin: "0 1.5rem",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </Flex>
            </Card>

            <Spacing spacing="xl" />

            <section aria-labelledby="license-projects-heading">
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="license-projects-heading" hierarchy="secondary" size="lg">
                        {copy.projects}
                    </Text>
                    <Badge color="secondary">{projects.length}</Badge>
                </Flex>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {copy.description}
                </Text>
                <Spacing spacing="md" />

                <Row>
                    {projects.map((project) => (
                        <Col key={project.id} xs={6} mb={1}>
                            <Link href={`/${locale}/licenses/customer/${encodeURIComponent(project.id)}`} prefetch style={{ display: "contents" }}>
                                <Card color="secondary" clickable h="100%">
                                    <Flex style={{ flexDirection: "column", gap: "1.25rem" }}>
                                        <Flex align="center" style={{ gap: "0.85rem" }}>
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                                <IconStack2 aria-hidden="true" size={16} />
                                            </span>
                                            <Text size="md" hierarchy="primary" fw={500}>
                                                {project.name}
                                            </Text>
                                        </Flex>
                                        <Flex align="center" style={{ gap: "0.4rem" }}>
                                            <IconKey aria-hidden="true" size={15} />
                                            <Text size="sm" hierarchy="tertiary">
                                                {project.licenseCount} {copy.licenses}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Link>
                        </Col>
                    ))}

                    {projects.length === 0 && (
                        <Col xs={6} mb={1} mih="100px">
                            <Card dashed color="secondary" h="100%">
                                <Flex align="center" justify="center" h="100%" style={{ flexDirection: "column", gap: "0.4rem", textAlign: "center" }}>
                                    <IconKey aria-hidden="true" size={18} />
                                    <Text size="md" hierarchy="tertiary">
                                        {copy.emptyTitle}
                                    </Text>
                                    <Text size="sm" hierarchy="tertiary">
                                        {copy.emptyDescription}
                                    </Text>
                                </Flex>
                            </Card>
                        </Col>
                    )}
                </Row>
            </section>
        </>
    )
}
