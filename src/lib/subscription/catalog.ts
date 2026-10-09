import type { SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"

type UsagePackageConfig = { default?: number; packages: number[] }

export type SubscriptionSelectionCatalog = Pick<SubscriptionConfigData, "defaults"> & {
    workflowExecutions: Record<"b2b" | "b2c", UsagePackageConfig>
    aiTokens: Record<"b2b" | "b2c", UsagePackageConfig>
}

export type SubscriptionCatalog = SubscriptionSelectionCatalog & Pick<SubscriptionConfigData, "packages" | "paymentPeriod"> & {
    subscriptionPrices: SubscriptionPriceCatalog
}

export function getSubscriptionSelectionCatalog(config: SubscriptionConfigData, checkoutPackages?: CheckoutPackages): SubscriptionSelectionCatalog {
    return {
        defaults: config.defaults,
        workflowExecutions: checkoutPackages?.quantitySteps
            ? { b2b: { packages: checkoutPackages.quantitySteps.b2b.workflowExecutions }, b2c: { packages: checkoutPackages.quantitySteps.b2c.workflowExecutions } }
            : { b2b: { packages: [] }, b2c: { packages: [] } },
        aiTokens: checkoutPackages?.quantitySteps
            ? { b2b: { packages: checkoutPackages.quantitySteps.b2b.aiTokens }, b2c: { packages: checkoutPackages.quantitySteps.b2c.aiTokens } }
            : { b2b: { packages: [] }, b2c: { packages: [] } },
    }
}

export function getSubscriptionCatalog(config: SubscriptionConfigData, subscriptionPrices: SubscriptionPriceCatalog, checkoutPackages?: CheckoutPackages): SubscriptionCatalog {
    return { ...getSubscriptionSelectionCatalog(config, checkoutPackages), packages: config.packages, paymentPeriod: config.paymentPeriod, subscriptionPrices }
}
