"use client"

import { cn } from "@/lib/utils"
import { IconX } from "@tabler/icons-react"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { useIsMobileCheckout, useScrollLock } from "./useMobileCheckout"

interface CheckoutMobileSheetProps {
    children: ReactNode
    closeLabel: string
    onClose: () => void
    open: boolean
    title: string
}

/**
 * Bottom sheet below `lg`, plain inline column from `lg` up. The children stay mounted while the sheet is closed: the
 * Stripe Elements inside must not remount. While open, focus moves to the close button, the page behind does not
 * scroll, and focus returns to the opener on close. The caller makes the page behind inert.
 */
export function CheckoutMobileSheet({ children, closeLabel, onClose, open, title }: CheckoutMobileSheetProps) {
    const isMobile = useIsMobileCheckout()
    const sheetOpen = open && isMobile
    const titleId = useId()
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    useScrollLock(sheetOpen)

    useEffect(() => {
        if (!sheetOpen) return
        const opener = document.activeElement
        closeButtonRef.current?.focus({ preventScroll: true })
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", closeOnEscape)
        return () => {
            window.removeEventListener("keydown", closeOnEscape)
            if (opener instanceof HTMLElement) opener.focus({ preventScroll: true })
        }
    }, [onClose, sheetOpen])

    return (
        <div
            className={cn(
                "min-w-0 flex-[1.25] lg:relative lg:flex",
                "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:flex max-lg:items-end max-lg:justify-center",
                open ? "max-lg:visible" : "max-lg:pointer-events-none max-lg:invisible"
            )}
        >
            {/* Pointer-only backdrop; keyboard and screen reader users close through the labelled button. */}
            <div aria-hidden="true" onClick={onClose} className={cn("fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden", open ? "opacity-100" : "opacity-0")} />
            <div
                role={sheetOpen ? "dialog" : undefined}
                aria-modal={sheetOpen || undefined}
                aria-labelledby={sheetOpen ? titleId : undefined}
                inert={isMobile && !open ? true : undefined}
                className={cn(
                    "pointer-events-auto relative flex max-h-[94dvh] w-full min-h-0 flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-primary text-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    "lg:sticky lg:top-4 lg:max-h-none lg:flex-1 lg:self-start lg:translate-y-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none",
                    open ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* `max-lg:flex` instead of `flex lg:hidden`: Pictor ships an unlayered `.flex` rule that beats `lg:hidden`. */}
                <div className="hidden shrink-0 items-center justify-between gap-3 border-b border-white/5 px-4 py-2 max-lg:flex sm:px-6">
                    <h2 id={titleId} className="min-w-0 truncate text-base font-semibold text-white">
                        {title}
                    </h2>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label={closeLabel}
                        className="-mr-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-secondary outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <IconX aria-hidden="true" size={20} />
                    </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:overflow-visible lg:p-0 lg:pt-7">{children}</div>
            </div>
        </div>
    )
}
