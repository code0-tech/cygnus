"use client"

import { SubscriptionConfigurator, type SubscriptionIcons, type SubscriptionOptionImageKey } from "@/components/subscription/SubscriptionConfigurator"
import { SubscriptionContent } from "@/components/subscription/SubscriptionContent"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export type { SubscriptionIcons } from "@/components/subscription/SubscriptionConfigurator"

export function SubscriptionConfiguratorSection({
    locale,
    content,
    icons,
    subscriptionPrices,
}: {
    locale: AppLocale
    content: SubscriptionConfiguratorContent
    icons: SubscriptionIcons
    subscriptionPrices: SubscriptionPriceCatalog
}) {
    const searchParams = useSearchParams()
    const [activeImageKey, setActiveImageKey] = useState<SubscriptionOptionImageKey>(() => {
        const customerType = searchParams.get("customerType")
        return customerType === "b2b" || customerType === "b2c" ? customerType : content.defaults.customerType
    })

    return (
        <div className="grid gap-16 lg:grid-cols-5">
            <SubscriptionContent activeImageKey={activeImageKey} content={content} />
            <SubscriptionConfigurator locale={locale} content={content} icons={icons} subscriptionPrices={subscriptionPrices} onActiveImageChangeAction={setActiveImageKey} />
        </div>
    )
}
