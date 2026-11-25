import type { SubscriptionConfigData } from "@/lib/cms"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { SubscriptionSelectionDefaults } from "@/lib/subscription/types"

type UsagePackageConfig = { default?: number; packages: number[] }

export type SubscriptionSelectionCatalog = {
    defaults: SubscriptionConfigData["defaults"] & { plan?: "pro" | "max" | "custom" }
    workflowExecutions: Record<"b2b" | "b2c", UsagePackageConfig>
    aiTokens: Record<"b2b" | "b2c", UsagePackageConfig>
}

export type SubscriptionCatalog = SubscriptionSelectionCatalog & Pick<SubscriptionConfigData, "paymentPeriod"> & {
    subscriptionPrices: SubscriptionPriceCatalog
}

function getSubscriptionSelectionCatalog(config: SubscriptionConfigData, checkoutPackages?: CheckoutPackages, defaults?: SubscriptionSelectionDefaults): SubscriptionSelectionCatalog {
    return {
        defaults: {
            customerType: defaults?.customerType ?? config.defaults.customerType,
            deployment: defaults?.deployment ?? config.defaults.deployment,
            plan: defaults?.plan ?? undefined,
            paymentPeriod: {
                b2b: defaults?.paymentPeriodB2B ?? config.defaults.paymentPeriod.b2b,
                b2c: defaults?.paymentPeriodB2C ?? config.defaults.paymentPeriod.b2c,
            },
        },
        workflowExecutions: checkoutPackages?.quantitySteps
            ? {
                  b2b: { packages: checkoutPackages.quantitySteps.b2b.workflowExecutions, default: defaults?.usageB2B?.workflowExecutions ?? undefined },
                  b2c: { packages: checkoutPackages.quantitySteps.b2c.workflowExecutions, default: defaults?.usageB2C?.workflowExecutions ?? undefined },
              }
            : { b2b: { packages: [] }, b2c: { packages: [] } },
        aiTokens: checkoutPackages?.quantitySteps
            ? {
                  b2b: { packages: checkoutPackages.quantitySteps.b2b.aiTokens, default: defaults?.usageB2B?.aiTokens ?? undefined },
                  b2c: { packages: checkoutPackages.quantitySteps.b2c.aiTokens, default: defaults?.usageB2C?.aiTokens ?? undefined },
              }
            : { b2b: { packages: [] }, b2c: { packages: [] } },
    }
}

export function getSubscriptionCatalog(config: SubscriptionConfigData, subscriptionPrices: SubscriptionPriceCatalog, checkoutPackages?: CheckoutPackages, defaults?: SubscriptionSelectionDefaults): SubscriptionCatalog {
    return { ...getSubscriptionSelectionCatalog(config, checkoutPackages, defaults), paymentPeriod: config.paymentPeriod, subscriptionPrices }
}
