"use client"

import {
    Button,
    Card,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    ScrollArea,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
    Spacing,
    Text,
} from "@code0-tech/pictor"
import { Layout } from "@code0-tech/pictor/dist/components/layout/Layout"
import { Tab } from "@code0-tech/pictor/dist/components/tab/Tab"
import { IconArrowLeft } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface LicenseDialogProps {
    backLabel: string
    children: ReactNode
    description?: string
    onClose: () => void
    open?: boolean
    sidebar?: ReactNode
    title: string
}

export function LicenseDialog({ backLabel, children, description, onClose, open = true, sidebar, title }: LicenseDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent showCloseButton={false} className="h-[calc(100dvh-1rem)]! w-[calc(100vw-1rem)]! max-w-none! overflow-hidden! border border-white/5 p-0.5! sm:h-[75dvh]! sm:w-[75vw]!">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    {description ? <DialogDescription className="sr-only">{description}</DialogDescription> : null}

                    <Tab orientation="vertical" defaultValue="general" className="h-full! w-full!">
                        <Layout
                            layoutGap={0}
                            showLayoutSplitter={false}
                            className="h-full! w-full! [&_.d-layout__inner]:h-full [&_.d-layout__middle]:h-full [&_.d-layout__middle]:min-h-0 [&_.d-layout__middle]:flex-col sm:[&_.d-layout__middle]:flex-row [&_.d-layout__content]:min-h-0 [&_.d-layout__content]:min-w-0 [&_.d-layout__content]:flex-1"
                            leftContent={
                                <div className="flex h-auto w-full flex-col p-4 sm:h-full sm:w-[clamp(12rem,20vw,18.75rem)] sm:p-8 lg:p-10">
                                    <Text fz={2} hierarchy="primary">
                                        {title}
                                    </Text>
                                    {description ? (
                                        <>
                                            <Spacing spacing="xs" />
                                            <Text maw="250px" hierarchy="tertiary" className="wrap-break-word">
                                                {description}
                                            </Text>
                                        </>
                                    ) : null}
                                    {sidebar ? (
                                        <>
                                            <Spacing spacing="xl" />
                                            {sidebar}
                                        </>
                                    ) : null}
                                    <DialogClose asChild>
                                        <Button type="button" paddingSize="xxs" w="100%" variant="none" justify="start" className="mt-4! sm:mt-auto!">
                                            <IconArrowLeft aria-hidden="true" size={16} />
                                            <Text size="md">{backLabel}</Text>
                                        </Button>
                                    </DialogClose>
                                </div>
                            }
                        >
                            <Card color="primary" p="0" paddingSize="md" h="100%" w="100%" className="min-w-0 overflow-hidden!">
                                <ScrollArea h="100%" type="scroll">
                                    <ScrollAreaViewport className="h-full! w-full!">
                                        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:w-3/4 sm:px-4 sm:py-16">{children}</div>
                                    </ScrollAreaViewport>
                                    <ScrollAreaScrollbar orientation="vertical" className="w-1.5!">
                                        <ScrollAreaThumb className="bg-white/15! hover:bg-white/25!" />
                                    </ScrollAreaScrollbar>
                                </ScrollArea>
                            </Card>
                        </Layout>
                    </Tab>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
