import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"

function NavigationMenu({ align = "start", className, children, ...props }: NavigationMenuPrimitive.Root.Props & Pick<NavigationMenuPrimitive.Positioner.Props, "align">) {
    return (
        <NavigationMenuPrimitive.Root data-slot="navigation-menu" className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)} {...props}>
            {children}
            <NavigationMenuPositioner align={align} />
        </NavigationMenuPrimitive.Root>
    )
}

function NavigationMenuList({ className, ...props }: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
    return <NavigationMenuPrimitive.List data-slot="navigation-menu-list" className={cn("group flex flex-1 list-none items-center justify-center gap-0", className)} {...props} />
}

function NavigationMenuItem({ className, ...props }: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
    return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />
}

function NavigationMenuTrigger({ className, children, showIcon = true, ...props }: NavigationMenuPrimitive.Trigger.Props & { showIcon?: boolean }) {
    return (
        <NavigationMenuPrimitive.Trigger
            data-slot="navigation-menu-trigger"
            className={cn(
                "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-xl px-4 py-1 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 focus:bg-white/10 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-white/10 data-open:bg-white/10",
                "group",
                className
            )}
            {...props}
        >
            {children}
            {showIcon && (
                <IconChevronUp
                    size={16}
                    className="relative top-px mx-1 mb-0.5 text-tertiary transition duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180 group-data-open/navigation-menu-trigger:rotate-180"
                    aria-hidden="true"
                />
            )}
        </NavigationMenuPrimitive.Trigger>
    )
}

function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
    return (
        <NavigationMenuPrimitive.Content
            data-slot="navigation-menu-content"
            className={cn(
                "data-ending-style:data-activation-direction=left:translate-x-1 data-ending-style:data-activation-direction=right:-translate-x-1 data-starting-style:data-activation-direction=left:-translate-x-1 data-starting-style:data-activation-direction=right:translate-x-1 h-full w-auto p-2 transition-[opacity,transform,translate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
                className
            )}
            {...props}
        />
    )
}

function NavigationMenuPositioner({ className, side = "bottom", sideOffset = 8, align = "start", alignOffset = 0, ...props }: NavigationMenuPrimitive.Positioner.Props) {
    return (
        <NavigationMenuPrimitive.Portal>
            <NavigationMenuPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                className={cn(
                    "isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none data-[side=bottom]:before:-top-2.5 data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0",
                    className
                )}
                {...props}
            >
                <NavigationMenuPrimitive.Popup className="xs:w-(--popup-width) relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-2xl border border-white/10 bg-primary/80 text-white backdrop-blur-lg transition-[opacity,transform,width,height,scale,translate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
                    <NavigationMenuPrimitive.Viewport className="relative size-full overflow-hidden" />
                </NavigationMenuPrimitive.Popup>
            </NavigationMenuPrimitive.Positioner>
        </NavigationMenuPrimitive.Portal>
    )
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
    return (
        <NavigationMenuPrimitive.Link
            data-slot="navigation-menu-link"
            className={cn(
                "flex items-center gap-1.5 rounded-xl p-2 text-sm text-white outline-none transition-colors hover:bg-white/10 focus:bg-white/10 data-[active=true]:bg-white/10 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        />
    )
}

export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger }
