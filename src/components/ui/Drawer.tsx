"use client"

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "@/lib/utils"
import { createContext, useContext, type ComponentPropsWithRef } from "react"

type DrawerSide = "top" | "right" | "bottom" | "left"

const DrawerSideContext = createContext<DrawerSide>("bottom")

const swipeDirectionBySide: Record<DrawerSide, DrawerPrimitive.Root.Props["swipeDirection"]> = {
    top: "up",
    right: "right",
    bottom: "down",
    left: "left",
}

function Drawer({ side = "bottom", swipeDirection, ...props }: DrawerPrimitive.Root.Props & { side?: DrawerSide }) {
    return (
        <DrawerSideContext.Provider value={side}>
            <DrawerPrimitive.Root data-slot="drawer" swipeDirection={swipeDirection ?? swipeDirectionBySide[side]} {...props} />
        </DrawerSideContext.Provider>
    )
}

function DrawerTrigger(props: ComponentPropsWithRef<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: ComponentPropsWithRef<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerBackdrop({ className, ...props }: ComponentPropsWithRef<typeof DrawerPrimitive.Backdrop>) {
    return (
        <DrawerPrimitive.Backdrop
            data-slot="drawer-backdrop"
            className={cn(
                "fixed inset-0 z-50 bg-black opacity-[calc(0.65*(1-var(--drawer-swipe-progress)))] backdrop-blur-sm transition-opacity duration-[calc(var(--drawer-swipe-strength,1)*300ms)] ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none",
                className
            )}
            {...props}
        />
    )
}

const viewportClasses: Record<DrawerSide, string> = {
    top: "items-start justify-center",
    right: "items-stretch justify-end",
    bottom: "items-end justify-center",
    left: "items-stretch justify-start",
}

function DrawerViewport({ className, ...props }: ComponentPropsWithRef<typeof DrawerPrimitive.Viewport>) {
    const side = useContext(DrawerSideContext)

    return <DrawerPrimitive.Viewport data-slot="drawer-viewport" className={cn("pointer-events-none fixed inset-0 z-50 flex overflow-hidden", viewportClasses[side], className)} {...props} />
}

const popupClasses: Record<DrawerSide, string> = {
    top: "max-h-[calc(100dvh-1rem)] w-full rounded-b-2xl border-b translate-y-(--drawer-swipe-movement-y) data-ending-style:-translate-y-full data-starting-style:-translate-y-full",
    right: "h-full w-[min(28rem,calc(100vw-1rem))] border-l translate-x-(--drawer-swipe-movement-x) data-ending-style:translate-x-full data-starting-style:translate-x-full",
    bottom: "max-h-[calc(100dvh-1rem)] w-full rounded-t-2xl border-t translate-y-[calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))] data-ending-style:translate-y-full data-starting-style:translate-y-full",
    left: "h-full w-[min(28rem,calc(100vw-1rem))] border-r translate-x-(--drawer-swipe-movement-x) data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
}

function DrawerPopup({ className, ...props }: ComponentPropsWithRef<typeof DrawerPrimitive.Popup>) {
    const side = useContext(DrawerSideContext)

    return (
        <DrawerPrimitive.Popup
            data-slot="drawer-popup"
            className={cn(
                "pointer-events-auto relative flex min-h-0 flex-col overflow-hidden border-white/10 bg-primary text-white shadow-2xl outline-none transition-transform duration-[calc(var(--drawer-swipe-strength,1)*300ms)] ease-[cubic-bezier(0.22,1,0.36,1)] data-swiping:select-none data-swiping:duration-0 motion-reduce:transition-none",
                popupClasses[side],
                className
            )}
            {...props}
        />
    )
}

function DrawerContent({ className, ...props }: ComponentPropsWithRef<typeof DrawerPrimitive.Content>) {
    return <DrawerPrimitive.Content data-slot="drawer-content" className={cn("min-h-0 overflow-y-auto p-6", className)} {...props} />
}

function DrawerHandle({ className, ...props }: ComponentPropsWithRef<"div">) {
    return <div data-slot="drawer-handle" aria-hidden="true" className={cn("mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-white/20", className)} {...props} />
}

export {
    Drawer,
    DrawerBackdrop,
    DrawerContent,
    DrawerHandle,
    DrawerPopup,
    DrawerPortal,
    DrawerTrigger,
    DrawerViewport,
}
