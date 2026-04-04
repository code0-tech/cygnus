"use client"

import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import type { AppLocale } from "@/lib/i18n"
import { IconShoppingCart } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface BuyMenuProps {
    price: string
    priceHeading: string
    priceCaption: string
    subscribeHref: string
    subscribeLabel: string
    locale?: AppLocale
}

export function BuyMenu({
    price,
    priceHeading,
    priceCaption,
    subscribeHref,
    subscribeLabel,
    locale,
}: BuyMenuProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-row items-center gap-6 rounded-3xl bg-primary/30 backdrop-blur-md border border-white/10 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                    {priceHeading}
                </span>
                <div className="flex flex-row items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-brand tabular-nums">
                        {price}
                    </span>
                    <span className="text-xs text-white/45">
                        {priceCaption}
                    </span>
                </div>
            </div>

            <HapticButtonLink
                href={subscribeHref}
                variant="filled"
                className="bg-white/80! text-primary! hover:bg-white! font-semibold! tracking-wide! gap-3!"
                locale={locale}
            >
                <IconShoppingCart size={20} stroke={2.2} className="text-black/75" />
                {subscribeLabel}
            </HapticButtonLink>
        </div>,
        document.body,
    )
}
