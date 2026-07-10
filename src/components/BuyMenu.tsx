"use client"

import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { IconShoppingCart } from "@tabler/icons-react"
import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import NumberFlow from "@number-flow/react"

interface BuyMenuProps {
    price: number
    priceHeading: string
    priceCaption: string
    subscribeHref: string
    subscribeLabel: string
}

const subscribeToClient = () => () => {}

export function BuyMenu({ price, priceHeading, priceCaption, subscribeHref, subscribeLabel }: BuyMenuProps) {
    const isClient = useSyncExternalStore(
        subscribeToClient,
        () => true,
        () => false
    )

    if (!isClient) return null

    return createPortal(
        <div className="fixed bottom-4 left-1/2 z-50 grid w-[calc(100vw-2.5rem)] max-w-92 -translate-x-1/2 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-3xl border border-white/10 bg-primary/30 p-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md sm:bottom-6 sm:w-auto sm:max-w-none sm:grid-cols-[auto_auto] sm:gap-6 sm:p-4">
            <div className="min-w-0">
                <span className="text-xs font-semibold tracking-wider text-tertiary uppercase">{priceHeading}</span>
                <div className="flex min-w-0 flex-row items-baseline gap-1.5 whitespace-nowrap">
                    <NumberFlow value={price} format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }} className="text-xl font-semibold text-brand sm:text-2xl" />
                    <span className="truncate text-xs text-tertiary">{priceCaption}</span>
                </div>
            </div>

            <HapticButtonLink
                href={subscribeHref}
                variant="filled"
                className="justify-self-end bg-white/80! px-2.5! text-primary! hover:bg-white! font-semibold! tracking-wide! gap-2! sm:px-4! sm:gap-3!"
            >
                <IconShoppingCart size={20} stroke={2.2} className="text-black/75" />
                {subscribeLabel}
            </HapticButtonLink>
        </div>,
        document.body
    )
}
