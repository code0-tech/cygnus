import type { SubscriptionConfigData } from "@/lib/cms"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"

export type SubscriptionSelectionCatalog = Pick<
    SubscriptionConfigData,
    | "defaults"
    | "packages"
    | "paymentPeriod"
    | "workflowExecutions"
    | "aiTokens"
    | "additionalFeatures"
>

export type SubscriptionCatalog = SubscriptionSelectionCatalog & {
    subscriptionPrices: SubscriptionPriceCatalog
}

export function getSubscriptionCatalog(config: SubscriptionConfigData, subscriptionPrices: SubscriptionPriceCatalog): SubscriptionCatalog {
    return {
        defaults: config.defaults,
        packages: config.packages,
        paymentPeriod: config.paymentPeriod,
        workflowExecutions: config.workflowExecutions,
        aiTokens: config.aiTokens,
        additionalFeatures: config.additionalFeatures,
        subscriptionPrices,
    }
}
