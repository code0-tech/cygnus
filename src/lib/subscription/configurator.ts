import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import type { PaymentPeriod } from "@/lib/subscription/calculator"
import type { SubscriptionSelectionCatalog } from "@/lib/subscription/catalog"
import { getDefaultUsagePackage, isUsagePackage, normalizeUsagePackages, snapToUsagePackage, type UsagePackagesConfig } from "@/lib/subscription/usagePackages"

export type SubscriptionPlan = "pro" | "max" | "custom"
type SubscriptionDeploymentMode = "self_hosted" | "cloud"
export type SubscriptionCustomerType = "b2b" | "b2c"

export type SubscriptionSelection = {
    plan: SubscriptionPlan
    deployment: SubscriptionDeploymentMode
    customerType: SubscriptionCustomerType
    paymentPeriod: PaymentPeriod
    workflowExecutions: number
    aiTokens: number
}

export type RawSubscriptionSelection = Partial<Record<"plan" | "deploymentType" | "deployment" | "customerType" | "paymentPeriod" | "workflowExecutions" | "aiTokens", string | null | undefined>>

export type SubscriptionSelectionIssue = {
    field: keyof RawSubscriptionSelection
    message: string
}

export type SubscriptionSelectionAction =
    | { type: "customerTypeChanged"; value: SubscriptionCustomerType }
    | { type: "planChanged"; value: SubscriptionPlan }
    | { type: "deploymentChanged"; value: SubscriptionDeploymentMode }
    | { type: "paymentPeriodChanged"; value: PaymentPeriod }
    | { type: "workflowExecutionsChanged"; value: number }
    | { type: "aiTokensChanged"; value: number }

const PLANS = new Set<SubscriptionPlan>(["pro", "max", "custom"])
const DEPLOYMENTS = new Set<SubscriptionDeploymentMode>(["self_hosted", "cloud"])
const CUSTOMER_TYPES = new Set<SubscriptionCustomerType>(["b2b", "b2c"])
const PAYMENT_PERIOD_OPTIONS: readonly PaymentPeriod[] = ["monthly", "quarterly", "yearly"]
const PAYMENT_PERIODS = new Set<PaymentPeriod>(PAYMENT_PERIOD_OPTIONS)

function rawValue(raw: RawSubscriptionSelection | URLSearchParams, key: keyof RawSubscriptionSelection) {
    return raw instanceof URLSearchParams ? raw.get(key) : raw[key]
}

export function getPaymentPeriodOptions(_customerType: SubscriptionCustomerType) {
    return PAYMENT_PERIOD_OPTIONS
}

export function getPaymentPeriodForCustomerType(_customerType: SubscriptionCustomerType, period: PaymentPeriod): PaymentPeriod {
    return PAYMENT_PERIODS.has(period) ? period : "monthly"
}

function normalizeUsageValue(value: number, config: UsagePackagesConfig) {
    return snapToUsagePackage(value, normalizeUsagePackages(config.packages))
}

function parseUsage(raw: string | null | undefined, config: UsagePackagesConfig, field: "workflowExecutions" | "aiTokens", issues: SubscriptionSelectionIssue[]) {
    const fallback = getDefaultUsagePackage(config)
    if (raw == null || raw === "") return fallback
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
        issues.push({ field, message: `${field} must be a non-negative integer.` })
        return fallback
    }
    const parsed = Number(raw)
    const packages = normalizeUsagePackages(config.packages)
    if (!isUsagePackage(parsed, packages)) issues.push({ field, message: `${field} must be one of ${packages.join(", ")}.` })
    return snapToUsagePackage(parsed, packages)
}

export function resolveSubscriptionSelection(raw: RawSubscriptionSelection | URLSearchParams, config: SubscriptionSelectionCatalog) {
    const issues: SubscriptionSelectionIssue[] = []
    const rawCustomerType = rawValue(raw, "customerType")
    const customerType = CUSTOMER_TYPES.has(rawCustomerType as SubscriptionCustomerType) ? (rawCustomerType as SubscriptionCustomerType) : (config.defaults?.customerType ?? "b2c")
    if (rawCustomerType && rawCustomerType !== customerType) issues.push({ field: "customerType", message: "customerType must be b2b or b2c." })

    const rawPlan = rawValue(raw, "plan")
    const plan = PLANS.has(rawPlan as SubscriptionPlan) ? (rawPlan as SubscriptionPlan) : "custom"
    if (rawPlan && rawPlan !== plan) issues.push({ field: "plan", message: "plan must be pro, max, or custom." })

    const rawDeployment = rawValue(raw, "deploymentType") ?? rawValue(raw, "deployment")
    const deployment = DEPLOYMENTS.has(rawDeployment as SubscriptionDeploymentMode) ? (rawDeployment as SubscriptionDeploymentMode) : config.defaults?.deployment === "cloud" ? "cloud" : "self_hosted"
    if (rawDeployment && rawDeployment !== deployment) issues.push({ field: "deploymentType", message: "deploymentType must be cloud or self_hosted." })

    const rawPeriod = rawValue(raw, "paymentPeriod")
    const requestedPeriod = PAYMENT_PERIODS.has(rawPeriod as PaymentPeriod) ? (rawPeriod as PaymentPeriod) : (config.defaults?.paymentPeriod?.[customerType] ?? "monthly")
    if (rawPeriod && rawPeriod !== requestedPeriod) issues.push({ field: "paymentPeriod", message: "paymentPeriod must be monthly, quarterly, or yearly." })
    const paymentPeriod = getPaymentPeriodForCustomerType(customerType, requestedPeriod)

    const usageIssues = plan === "custom" && (!rawCustomerType || CUSTOMER_TYPES.has(rawCustomerType as SubscriptionCustomerType)) ? issues : []
    const workflowExecutions = plan === "custom" ? parseUsage(rawValue(raw, "workflowExecutions"), config.workflowExecutions[customerType], "workflowExecutions", usageIssues) : 0
    const aiTokens = plan === "custom" ? parseUsage(rawValue(raw, "aiTokens"), config.aiTokens[customerType], "aiTokens", usageIssues) : 0

    return { selection: { plan, deployment, customerType, paymentPeriod, workflowExecutions, aiTokens }, issues }
}

export function reduceSubscriptionSelection(selection: SubscriptionSelection, action: SubscriptionSelectionAction, config: SubscriptionSelectionCatalog): SubscriptionSelection {
    const next = { ...selection }
    if (action.type === "customerTypeChanged") {
        next.customerType = action.value
        next.paymentPeriod = getPaymentPeriodForCustomerType(action.value, next.paymentPeriod)
        next.workflowExecutions = getDefaultUsagePackage(config.workflowExecutions[action.value])
        next.aiTokens = getDefaultUsagePackage(config.aiTokens[action.value])
    } else if (action.type === "planChanged") next.plan = action.value
    else if (action.type === "deploymentChanged") next.deployment = action.value
    else if (action.type === "paymentPeriodChanged") next.paymentPeriod = getPaymentPeriodForCustomerType(next.customerType, action.value)
    else if (action.type === "workflowExecutionsChanged") next.workflowExecutions = normalizeUsageValue(action.value, config.workflowExecutions[next.customerType])
    else if (action.type === "aiTokensChanged") next.aiTokens = normalizeUsageValue(action.value, config.aiTokens[next.customerType])
    return next
}

export function parseSubscriptionSelectionFromSearchParams(searchParams: URLSearchParams, content: SubscriptionConfiguratorContent) {
    return resolveSubscriptionSelection(searchParams, content).selection
}

export function buildSubscriptionSelectionSearchParams(selection: SubscriptionSelection) {
    const params = new URLSearchParams({ plan: selection.plan, deploymentType: selection.deployment, customerType: selection.customerType, paymentPeriod: selection.paymentPeriod })
    if (selection.plan === "custom") {
        params.set("workflowExecutions", String(selection.workflowExecutions))
        params.set("aiTokens", String(selection.aiTokens))
    }
    return params
}
