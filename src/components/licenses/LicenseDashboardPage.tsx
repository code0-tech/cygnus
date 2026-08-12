"use client"

import type { License } from "@/components/licenses/LicenseSidebar"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import { Card, Col, Flex, Row, Spacing, Text } from "@code0-tech/pictor"
import { IconCreditCard, IconFileInvoice, IconKey, IconReceipt } from "@tabler/icons-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface LicenseDashboardPageProps {
    content: LicenseContent
    locale: AppLocale
    licenses?: License[]
}

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

export function LicenseDashboardPage({ content, locale, licenses = [] }: LicenseDashboardPageProps) {
    const metrics = [
        { icon: <IconKey aria-hidden="true" size={14} />, label: content.licenses, value: licenses.length },
        { icon: <IconReceipt aria-hidden="true" size={14} />, label: content.dashboard.customers, value: 0 },
        { icon: <IconCreditCard aria-hidden="true" size={14} />, label: content.dashboard.paymentProfiles, value: 0 },
        { icon: <IconFileInvoice aria-hidden="true" size={14} />, label: content.dashboard.invoices, value: 0 },
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

            <section aria-labelledby="licenses-heading">
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="licenses-heading" hierarchy="secondary" size="lg">
                        {content.licenses}
                    </Text>
                    <span className="inline-flex w-fit items-center rounded-full bg-[#191825] px-[0.35rem] py-[0.1167rem] text-[0.7rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                        {licenses.length}
                    </span>
                </Flex>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {content.dashboard.description}
                </Text>
                <Spacing spacing="md" />

                <Row>
                    {licenses.map((license) => (
                        <Col key={license.id} xs={6} mb={1}>
                            <Link href={`/${locale}/licenses/customer/${encodeURIComponent(license.id)}`} prefetch style={{ display: "contents" }}>
                                <Card color="secondary" clickable h="100%">
                                    <Flex style={{ flexDirection: "column", gap: "1.25rem" }}>
                                        <Flex align="center" style={{ gap: "0.85rem" }}>
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                                <IconKey aria-hidden="true" size={16} />
                                            </span>
                                            <Text size="md" hierarchy="primary" fw={500}>
                                                {license.name}
                                            </Text>
                                        </Flex>
                                        <Flex align="center" style={{ gap: "0.4rem" }}>
                                            <IconKey aria-hidden="true" size={15} />
                                            <Text size="sm" hierarchy="tertiary">
                                                {content.licenses}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Link>
                        </Col>
                    ))}

                    {licenses.length === 0 && (
                        <Col xs={6} mb={1} mih="100px">
                            <Card dashed color="secondary" h="100%">
                                <Flex align="center" justify="center" h="100%" style={{ flexDirection: "column", gap: "0.4rem", textAlign: "center" }}>
                                    <IconKey aria-hidden="true" size={18} />
                                    <Text size="md" hierarchy="tertiary">
                                        {content.emptyLicenses}
                                    </Text>
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.dashboard.emptyDescription}
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
