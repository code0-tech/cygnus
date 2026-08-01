import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import { clampToRange, type PaymentPeriod } from "@/lib/subscriptionCalculator"

export type SubscriptionConfiguratorPlan = "pro" | "max" | "custom"

export type SubscriptionConfiguratorStep = "customerType" | "plan" | "deployment" | "aiTokens" | "workflowExecutions" | "additionalFeatures" | "paymentPeriod"

export type SubscriptionDeploymentMode = "self_hosted" | "cloud"
export type SubscriptionCustomerType = "b2b" | "b2c"

export type SubscriptionSelection = {
    plan: SubscriptionConfiguratorPlan
    deployment: SubscriptionDeploymentMode
    customerType: SubscriptionCustomerType
    paymentPeriod: PaymentPeriod
    workflowExecutions: number
    aiTokens: number
}

export function getSubscriptionConfiguratorSteps(customerType: SubscriptionCustomerType, plan: SubscriptionConfiguratorPlan, hasAdditionalFeatures: boolean): SubscriptionConfiguratorStep[] {
    return [
        "customerType",
        ...(customerType === "b2b" ? [] : (["plan"] as SubscriptionConfiguratorStep[])),
        "deployment",
        ...(plan === "custom" ? (["aiTokens", "workflowExecutions", ...(hasAdditionalFeatures ? ["additionalFeatures"] : [])] as SubscriptionConfiguratorStep[]) : []),
        "paymentPeriod",
    ]
}

export function getPlanForCustomerType(customerType: "b2b" | "b2c", currentPlan: SubscriptionConfiguratorPlan): SubscriptionConfiguratorPlan {
    return customerType === "b2b" ? "custom" : currentPlan
}

export function getPaymentPeriodForCustomerType(customerType: SubscriptionCustomerType, currentPeriod: PaymentPeriod): PaymentPeriod {
    if (customerType === "b2b" && currentPeriod === "weekly") return "monthly"
    if (customerType === "b2c" && currentPeriod === "quarterly") return "monthly"
    return currentPeriod
}

function parsePlan(value: string | null): SubscriptionConfiguratorPlan | null {
    return value === "pro" || value === "max" || value === "custom" ? value : null
}

function parseDeployment(value: string | null): SubscriptionDeploymentMode | null {
    return value === "cloud" || value === "self_hosted" ? value : null
}

function parseCustomerType(value: string | null): SubscriptionCustomerType | null {
    return value === "b2b" || value === "b2c" ? value : null
}

function parsePaymentPeriod(value: string | null): PaymentPeriod | null {
    return value === "weekly" || value === "monthly" || value === "quarterly" || value === "yearly" ? value : null
}

function parseUsageValue(value: string | null): number | null {
    if (!value || !/^\d+$/.test(value)) return null
    const parsedValue = Number(value)
    return Number.isSafeInteger(parsedValue) ? parsedValue : null
}

export function parseSubscriptionSelectionFromSearchParams(searchParams: URLSearchParams, content: SubscriptionConfiguratorContent): SubscriptionSelection {
    const defaults = content.defaults
    const customerType = parseCustomerType(searchParams.get("customerType")) ?? defaults.customerType
    const plan = getPlanForCustomerType(customerType, parsePlan(searchParams.get("plan")) ?? "custom")
    const deployment = parseDeployment(searchParams.get("deploymentType")) ?? (defaults.deployment === "cloud" ? "cloud" : "self_hosted")
    const paymentPeriod = getPaymentPeriodForCustomerType(customerType, parsePaymentPeriod(searchParams.get("paymentPeriod")) ?? defaults.paymentPeriod[customerType])

    return {
        plan,
        deployment,
        customerType,
        paymentPeriod,
        workflowExecutions: clampToRange(parseUsageValue(searchParams.get("workflowExecutions")) ?? content.workflowExecutions[customerType].default, content.workflowExecutions[customerType]),
        aiTokens: clampToRange(parseUsageValue(searchParams.get("aiTokens")) ?? content.aiTokens[customerType].default, content.aiTokens[customerType]),
    }
}

export function parseSelectedAdditionalFeatureIndexes(searchParams: URLSearchParams, additionalFeatures: SubscriptionConfiguratorContent["additionalFeatures"]): Set<number> {
    const selectedIds = new Set(searchParams.get("additionalFeatures")?.split(",").filter(Boolean))
    const selectedIndexes = new Set<number>()

    additionalFeatures?.forEach((feature, index) => {
        if (selectedIds.has(feature.id ?? String(index))) selectedIndexes.add(index)
    })

    return selectedIndexes
}

export function buildSubscriptionSelectionSearchParams(selection: SubscriptionSelection, additionalFeatureIds: string[]): URLSearchParams {
    const searchParams = new URLSearchParams({
        plan: selection.plan,
        deploymentType: selection.deployment,
        customerType: selection.customerType,
        paymentPeriod: selection.paymentPeriod,
    })

    if (selection.plan === "custom") {
        searchParams.set("workflowExecutions", String(selection.workflowExecutions))
        searchParams.set("aiTokens", String(selection.aiTokens))

        if (additionalFeatureIds.length > 0) {
            searchParams.set("additionalFeatures", additionalFeatureIds.join(","))
        }
    }

    return searchParams
}
