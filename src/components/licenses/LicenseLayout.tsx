"use client"

import { LicenseDataProvider, useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicensePrimarySidebar } from "@/components/licenses/LicensePrimarySidebar"
import { LicenseSidebar } from "@/components/licenses/LicenseSidebar"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { AuroraBackground, Button, Card, Flex, FullScreen, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, Text } from "@code0-tech/pictor"
import { Fragment, type ReactNode, useState } from "react"

interface LicenseLayoutProps {
    children: ReactNode
    content: LicenseContent
    errors: ErrorsContent
    locale: AppLocale
    modal?: ReactNode
}

function LicenseLayoutContent({ children, content, errors, locale }: LicenseLayoutProps) {
    const { error, isRefreshing, isSidebarLoading, reload, sidebarLicenses } = useLicenseData()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const openMainApplication = (path: string) => {
        window.location.assign(new URL(path, content.redirectUrl).toString())
    }

    const logout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            const response = await fetch("/api/crater/auth/session", { method: "DELETE", credentials: "same-origin" })
            if (!response.ok) {
                setIsLoggingOut(false)
                return
            }

            window.location.replace(content.redirectUrl)
        } catch {
            setIsLoggingOut(false)
        }
    }

    return (
        <FullScreen className="relative isolate h-dvh! min-h-0! overflow-hidden! bg-primary! p-4! text-white">
            <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-1/2 w-full -scale-x-100 opacity-25">
                <div
                    className="absolute inset-0 z-1"
                    style={{
                        background: "radial-gradient(circle at top right, rgba(25, 24, 37, 0) 0%, var(--primary) 35%)",
                        WebkitBackdropFilter: "blur(5rem)",
                    }}
                />
                <AuroraBackground />
            </div>

            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-full opacity-25 blur-[5rem]">
                <AuroraBackground />
            </div>

            <div className="relative z-10 grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[3.5rem_18rem_minmax(0,1fr)] lg:grid-rows-1">
                <LicensePrimarySidebar content={content.sidebar} isLoggingOut={isLoggingOut} locale={locale} onLogout={() => void logout()} onOpenMainApplication={openMainApplication} />
                <LicenseSidebar
                    content={content}
                    isLoading={isSidebarLoading}
                    isLoggingOut={isLoggingOut}
                    isRefreshing={isRefreshing}
                    locale={locale}
                    licenses={sidebarLicenses}
                    onLogout={() => void logout()}
                    onRefresh={reload}
                />

                <main className="h-full min-h-0 w-[calc(100vw-2rem)] min-w-0 overflow-hidden rounded-2xl bg-transparent lg:w-auto">
                    <ScrollArea h="100%" type="scroll">
                        <ScrollAreaViewport>
                            <div className="mx-auto box-border w-full min-w-0 max-w-[52rem] px-4 py-10 sm:py-16">
                                {error ? (
                                    <Card color="secondary">
                                        <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                                            <Text size="sm" hierarchy="secondary">
                                                {error}
                                            </Text>
                                            <Button type="button" variant="normal" paddingSize="xs" onClick={reload}>
                                                {errors.retry}
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
        <LicenseDataProvider loadError={props.errors.dashboardLoad} redirectUrl={props.content.redirectUrl}>
            <LicenseLayoutContent key="content" {...props} />
            <Fragment key="modal">{props.modal}</Fragment>
        </LicenseDataProvider>
    )
}
