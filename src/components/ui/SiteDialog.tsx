"use client"

import {
    AutoScrollArea,
    Button,
    Card,
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
} from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const SITE_DIALOG_FRAME_CLASS_NAME = "h-[calc(100dvh-1rem)]! w-[calc(100vw-1rem)]! max-w-none! overflow-visible! border border-white/5 p-0.5! sm:h-[75dvh]! sm:w-[75vw]! sm:max-w-250!"

export function DialogSurface({ children, inlineOnDesktop = false, fitContent = false }: { children: ReactNode; inlineOnDesktop?: boolean; fitContent?: boolean }) {
    const content = <div className={cn("mx-auto w-full max-w-4xl px-4 py-10 sm:w-3/4 sm:px-4 sm:py-16", inlineOnDesktop && "lg:contents!")}>{children}</div>

    return (
        <Card color="primary" p="0" paddingSize="md" h={fitContent ? "auto" : "100%"} w="100%" className={cn("min-h-0 min-w-0 flex-1 overflow-hidden!", inlineOnDesktop && "lg:contents!")}>
            {fitContent ? (
                <AutoScrollArea mah="var(--site-dialog-content-max-height)" type="scroll">
                    {content}
                </AutoScrollArea>
            ) : (
                <ScrollArea h="100%" type="scroll" className={inlineOnDesktop ? "lg:contents!" : undefined}>
                    <ScrollAreaViewport className={cn("h-full! w-full!", inlineOnDesktop && "lg:contents!")}>{content}</ScrollAreaViewport>
                    <ScrollAreaScrollbar orientation="vertical" className={cn("w-1.5!", inlineOnDesktop && "lg:hidden!")}>
                        <ScrollAreaThumb className="bg-white/15! hover:bg-white/25!" />
                    </ScrollAreaScrollbar>
                </ScrollArea>
            )}
        </Card>
    )
}

export function SiteDialogContent({
    children,
    className,
    closeLabel = "Close",
    description,
    fitContent = false,
    title,
}: {
    children: ReactNode
    className?: string
    closeLabel?: string
    description?: string
    fitContent?: boolean
    title: string
}) {
    return (
        <DialogPortal>
            <DialogOverlay className={cn("backdrop-blur-sm", className)} />
            <DialogContent
                autoFocus
                showCloseButton={false}
                className={cn(
                    SITE_DIALOG_FRAME_CLASS_NAME,
                    fitContent &&
                        "h-fit! max-h-[calc(100dvh-1rem)]! [--site-dialog-content-max-height:calc(100dvh-5rem)] sm:h-fit! sm:max-h-[75dvh]! sm:[--site-dialog-content-max-height:calc(75dvh-4rem)]",
                    className
                )}
            >
                <div className={cn("relative flex min-h-0 w-full flex-col", !fitContent && "h-full")}>
                    <div className="flex shrink-0 justify-end p-2">
                        <DialogClose asChild>
                            <Button type="button" paddingSize="xxs" variant="none" aria-label={closeLabel}>
                                <IconX aria-hidden="true" size={16} />
                            </Button>
                        </DialogClose>
                    </div>
                    <DialogSurface fitContent={fitContent}>
                        <DialogTitle className="text-[22px]! font-normal! leading-tight! text-white!">{title}</DialogTitle>
                        {description ? (
                            <DialogDescription className="mt-1! text-base! text-tertiary!">{description}</DialogDescription>
                        ) : (
                            <DialogDescription className="sr-only">{title}</DialogDescription>
                        )}
                        <div className="pt-6">{children}</div>
                    </DialogSurface>
                </div>
            </DialogContent>
        </DialogPortal>
    )
}
