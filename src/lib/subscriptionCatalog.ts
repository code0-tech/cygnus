import type { SubscriptionConfigData } from "@/lib/cms"

export type SubscriptionCatalog = Pick<
    SubscriptionConfigData,
    "defaults" | "packages" | "paymentPeriod" | "workflowExecutions" | "workflowExecutionPriceFactor" | "aiTokens" | "aiTokenPriceFactor" | "additionalFeatures"
>

export function getSubscriptionCatalog(config: SubscriptionConfigData): SubscriptionCatalog {
    return {
        defaults: config.defaults,
        packages: config.packages,
        paymentPeriod: config.paymentPeriod,
        workflowExecutions: config.workflowExecutions,
        workflowExecutionPriceFactor: config.workflowExecutionPriceFactor,
        aiTokens: config.aiTokens,
        aiTokenPriceFactor: config.aiTokenPriceFactor,
        additionalFeatures: config.additionalFeatures,
    }
}
