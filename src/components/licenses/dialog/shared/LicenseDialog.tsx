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
    getSize,
    ScrollArea,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
    SegmentedControl,
    SegmentedControlItem,
    Tab,
    TabContent,
    Text,
    Tooltip,
    TooltipContent,
    TooltipPortal,
    TooltipTrigger,
} from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useEffect, useRef, type ComponentType, type CSSProperties, type ReactNode } from "react"

export interface LicenseDialogTab {
    value: string
    label: string
    icon: ComponentType<{ "aria-hidden"?: boolean; size?: number; style?: CSSProperties }>
    content: ReactNode
}

interface LicenseDialogProps {
    closeLabel: string
    description?: string
    onClose: () => void
    onValueChange?: (value: string) => void
    open?: boolean
    tabs: (LicenseDialogTab | false | null | undefined)[]
    title: string
    value?: string
}

export function LicenseDialog({ closeLabel, description, onClose, onValueChange, open = true, tabs, title, value }: LicenseDialogProps) {
    const visibleTabs = tabs.filter((tab): tab is LicenseDialogTab => Boolean(tab))
    const activeTab = value ?? visibleTabs[0]?.value
    const showTabs = visibleTabs.length > 1
    const navigationRef = useRef<HTMLDivElement>(null)
    const hadNavigationRef = useRef(showTabs)

    useEffect(() => {
        const navigationAppeared = open && showTabs && !hadNavigationRef.current
        hadNavigationRef.current = open && showTabs
        if (!navigationAppeared) return

        navigationRef.current?.querySelector<HTMLButtonElement>("button[data-license-tab-active]")?.focus({ preventScroll: true })
    }, [open, showTabs])

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent
                    autoFocus
                    showCloseButton={false}
                    className="h-[calc(100dvh-1rem)]! w-[calc(100vw-1rem)]! max-w-none! overflow-visible! border border-white/5 p-0.5! outline-none! sm:h-[75dvh]! sm:w-[75vw]! sm:max-w-250!"
                >
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    {description ? <DialogDescription className="sr-only">{description}</DialogDescription> : null}

                    <Tab orientation="vertical" value={activeTab} onValueChange={onValueChange} className="relative flex! h-full! w-full! flex-col!">
                        <div
                            ref={navigationRef}
                            className="flex items-center justify-between gap-2 p-2 sm:absolute sm:top-1/2 sm:left-0 sm:max-w-75 sm:-translate-x-full sm:-translate-y-1/2 sm:flex-col sm:items-end sm:p-10"
                        >
                            {showTabs ? (
                                <SegmentedControl
                                    type="single"
                                    color="secondary"
                                    aria-label={title}
                                    className="sm:flex-col!"
                                    style={{ padding: `calc(${getSize("xxs")} / 2)`, gap: getSize("xxs") }}
                                    value={activeTab}
                                    onValueChange={(nextValue) => nextValue && onValueChange?.(nextValue)}
                                >
                                    {visibleTabs.map((tab) => (
                                        <Tooltip key={tab.value}>
                                            <TooltipTrigger asChild>
                                                <SegmentedControlItem
                                                    value={tab.value}
                                                    aria-label={tab.label}
                                                    data-license-tab-active={tab.value === activeTab ? "" : undefined}
                                                    style={{ padding: getSize("xxs"), display: "flex", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <tab.icon aria-hidden style={{ minWidth: "16px", minHeight: "16px" }} size={16} />
                                                </SegmentedControlItem>
                                            </TooltipTrigger>
                                            <TooltipPortal>
                                                <TooltipContent side="left" sideOffset={8} color="secondary">
                                                    <Text size="sm">{tab.label}</Text>
                                                </TooltipContent>
                                            </TooltipPortal>
                                        </Tooltip>
                                    ))}
                                </SegmentedControl>
                            ) : (
                                <span />
                            )}
                            <DialogClose asChild>
                                <Button type="button" paddingSize="xxs" variant="none" aria-label={closeLabel} className="sm:hidden!">
                                    <IconX aria-hidden="true" size={16} />
                                </Button>
                            </DialogClose>
                        </div>
                        <Card color="primary" p="0" paddingSize="md" h="100%" w="100%" className="min-h-0 min-w-0 flex-1 overflow-hidden!">
                            <ScrollArea h="100%" type="scroll">
                                <ScrollAreaViewport className="h-full! w-full!">
                                    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:w-3/4 sm:px-4 sm:py-16">
                                        {visibleTabs.map((tab) => (
                                            <TabContent key={tab.value} tabIndex={-1} value={tab.value} className="overflow-hidden">
                                                {tab.content}
                                            </TabContent>
                                        ))}
                                    </div>
                                </ScrollAreaViewport>
                                <ScrollAreaScrollbar orientation="vertical" className="w-1.5!">
                                    <ScrollAreaThumb className="bg-white/15! hover:bg-white/25!" />
                                </ScrollAreaScrollbar>
                            </ScrollArea>
                        </Card>
                    </Tab>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
