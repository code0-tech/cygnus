export type SubscriptionConfiguratorPlan = "pro" | "max" | "custom"

export type SubscriptionConfiguratorStep = "customerType" | "plan" | "deployment" | "aiTokens" | "workflowExecutions" | "additionalFeatures" | "paymentPeriod"

export function getSubscriptionConfiguratorSteps(plan: SubscriptionConfiguratorPlan, hasAdditionalFeatures: boolean): SubscriptionConfiguratorStep[] {
    return [
        "customerType",
        "plan",
        "deployment",
        ...(plan === "custom" ? (["aiTokens", "workflowExecutions", ...(hasAdditionalFeatures ? ["additionalFeatures"] : [])] as SubscriptionConfiguratorStep[]) : []),
        "paymentPeriod",
    ]
}

export function getPlanForCustomerType(customerType: "b2b" | "b2c", currentPlan: SubscriptionConfiguratorPlan): SubscriptionConfiguratorPlan {
    return customerType === "b2b" ? "custom" : currentPlan
}
