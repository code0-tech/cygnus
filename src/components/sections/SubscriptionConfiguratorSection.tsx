import { SubscriptionConfigurator, type SubscriptionIcons } from "@/components/subscription/SubscriptionConfigurator"
import { SubscriptionContent } from "@/components/subscription/SubscriptionContent"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"

export type { SubscriptionIcons } from "@/components/subscription/SubscriptionConfigurator"

export function SubscriptionConfiguratorSection({ locale, content, icons }: { locale: AppLocale; content: SubscriptionConfiguratorContent; icons: SubscriptionIcons }) {
    return (
        <div className="grid gap-8 lg:grid-cols-5">
            <SubscriptionContent content={content} />
            <SubscriptionConfigurator locale={locale} content={content} icons={icons} />
        </div>
    )
}
