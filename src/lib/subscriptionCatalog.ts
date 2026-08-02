import type { SubscriptionConfigData } from "@/lib/cms"

export type SubscriptionCatalog = Pick<
    SubscriptionConfigData,
    | "defaults"
    | "packages"
    | "paymentPeriod"
    | "workflowExecutions"
    | "workflowExecutionPriceFactor"
    | "workflowExecutionWeeklyPriceFactor"
    | "aiTokens"
    | "aiTokenPriceFactor"
    | "aiTokenWeeklyPriceFactor"
    | "additionalFeatures"
>

export function getSubscriptionCatalog(config: SubscriptionConfigData): SubscriptionCatalog {
    return {
        defaults: config.defaults,
        packages: config.packages,
        paymentPeriod: config.paymentPeriod,
        workflowExecutions: config.workflowExecutions,
        workflowExecutionPriceFactor: config.workflowExecutionPriceFactor,
        workflowExecutionWeeklyPriceFactor: config.workflowExecutionWeeklyPriceFactor,
        aiTokens: config.aiTokens,
        aiTokenPriceFactor: config.aiTokenPriceFactor,
        aiTokenWeeklyPriceFactor: config.aiTokenWeeklyPriceFactor,
        additionalFeatures: config.additionalFeatures,
    }
}
