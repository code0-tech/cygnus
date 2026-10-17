"use client"

import { LicenseDataProvider, useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicensePrimarySidebar } from "@/components/licenses/layout/LicensePrimarySidebar"
import { LicenseSidebar } from "@/components/licenses/layout/LicenseSidebar"
import { LicenseNotifications } from "@/components/licenses/layout/LicenseNotifications"
import { logoutLicenseSession } from "@/lib/licenses/client"
import type { ErrorsContent, LicenseContent, LicenseToastsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { AuroraBackground, FullScreen, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@code0-tech/pictor"
import { notFound } from "next/navigation"
import { Fragment, type ReactNode, useState } from "react"

interface LicenseLayoutProps {
    children: ReactNode
    content: LicenseContent
    errors: ErrorsContent
    locale: AppLocale
    sculptorUrl: string
    modal?: ReactNode
    toasts: LicenseToastsContent
}

function LicenseLayoutContent({ children, content, locale, sculptorUrl }: LicenseLayoutProps) {
    const { error, isSidebarLoading, sidebarLicenses } = useLicenseData()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    if (error) notFound()

    const openMainApplication = (path: string, newWindow = false) => {
        const url = new URL(path, sculptorUrl).toString()
        if (newWindow) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.assign(url)
    }

    const logout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            await logoutLicenseSession()
            window.location.replace(sculptorUrl)
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

            <div className="relative z-10 grid h-full min-h-0 gap-4 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[3.5rem_12rem_minmax(0,1fr)] lg:grid-rows-1">
                <LicensePrimarySidebar content={content.sidebar} isLoggingOut={isLoggingOut} onLogout={() => void logout()} onOpenMainApplication={openMainApplication} />
                <LicenseSidebar content={content} isLoading={isSidebarLoading} isLoggingOut={isLoggingOut} locale={locale} licenses={sidebarLicenses} onLogout={() => void logout()} />

                <main className="h-full min-h-0 w-[calc(100vw-2rem)] min-w-0 overflow-hidden rounded-2xl bg-transparent lg:w-auto">
                    <div style={{ height: "100%", position: "relative", boxSizing: "border-box" }}>
                        <ScrollArea h={"100%"} type={"scroll"}>
                            <ScrollAreaViewport>
                                <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "1rem 1rem" }}>
                                    {children}
                                </div>
                            </ScrollAreaViewport>
                            <ScrollAreaScrollbar orientation={"vertical"}>
                                <ScrollAreaThumb />
                            </ScrollAreaScrollbar>
                        </ScrollArea>
                    </div>
                </main>
            </div>
        </FullScreen>
    )
}

export function LicenseLayout(props: LicenseLayoutProps) {
    return (
        <LicenseDataProvider loadError={props.errors.dashboardLoad} sessionError={props.errors.sessionUnavailable}>
            <LicenseNotifications errors={props.errors} locale={props.locale} toasts={props.toasts}>
                <LicenseLayoutContent key="content" {...props} />
                <Fragment key="modal">{props.modal}</Fragment>
            </LicenseNotifications>
        </LicenseDataProvider>
    )
}
