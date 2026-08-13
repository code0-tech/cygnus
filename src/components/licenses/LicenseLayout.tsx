"use client"

import { LicenseDataProvider, useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseSidebar } from "@/components/licenses/LicenseSidebar"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import { Button, Card, Flex, FullScreen, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, Text } from "@code0-tech/pictor"
import type { ReactNode } from "react"

interface LicenseLayoutProps {
    children: ReactNode
    content: LicenseContent
    locale: AppLocale
    modal?: ReactNode
}

function LicenseLayoutContent({ children, content, locale }: LicenseLayoutProps) {
    const { error, isLoading, licenses, reload } = useLicenseData()

    return (
        <FullScreen className="h-dvh! min-h-0! overflow-hidden! bg-light! p-4! text-white">
            <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <LicenseSidebar content={content} isLoading={isLoading} locale={locale} licenses={licenses} />

                <main className="h-full min-h-0 min-w-0 overflow-hidden rounded-2xl bg-primary">
                    <ScrollArea h="100%" type="scroll">
                        <ScrollAreaViewport>
                            <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1rem" }}>
                                {error ? (
                                    <Card color="secondary">
                                        <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                                            <Text size="sm" hierarchy="secondary">
                                                {error}
                                            </Text>
                                            <Button type="button" variant="normal" paddingSize="xs" onClick={reload}>
                                                {content.errors.retry}
                                            </Button>
                                        </Flex>
                                    </Card>
                                ) : (
                                    children
                                )}
                            </div>
                        </ScrollAreaViewport>
                        <ScrollAreaScrollbar orientation="vertical">
                            <ScrollAreaThumb />
                        </ScrollAreaScrollbar>
                    </ScrollArea>
                </main>
            </div>
        </FullScreen>
    )
}

export function LicenseLayout(props: LicenseLayoutProps) {
    return (
        <LicenseDataProvider loadError={props.content.errors.dashboardLoad} locale={props.locale} redirectUrl={props.content.redirectUrl}>
            <LicenseLayoutContent {...props} />
            {props.modal}
        </LicenseDataProvider>
    )
}
