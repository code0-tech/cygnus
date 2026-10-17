import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import type { PaymentPeriod, UsageRange } from "@/lib/subscriptionCalculator"
import type { SubscriptionSelectionCatalog } from "@/lib/subscriptionCatalog"

type SubscriptionConfiguratorPlan = "pro" | "max" | "custom"
type SubscriptionDeploymentMode = "self_hosted" | "cloud"
export type SubscriptionCustomerType = "b2b" | "b2c"

export type SubscriptionSelection = {
    plan: SubscriptionConfiguratorPlan
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
    | { type: "planChanged"; value: SubscriptionConfiguratorPlan }
    | { type: "deploymentChanged"; value: SubscriptionDeploymentMode }
    | { type: "paymentPeriodChanged"; value: PaymentPeriod }
    | { type: "workflowExecutionsChanged"; value: number }
    | { type: "aiTokensChanged"; value: number }

const PLANS = new Set<SubscriptionConfiguratorPlan>(["pro", "max", "custom"])
const DEPLOYMENTS = new Set<SubscriptionDeploymentMode>(["self_hosted", "cloud"])
const CUSTOMER_TYPES = new Set<SubscriptionCustomerType>(["b2b", "b2c"])
const PAYMENT_PERIODS = new Set<PaymentPeriod>(["weekly", "monthly", "quarterly", "yearly"])
// Which periods exist is a property of the customer type, not of the plan: B2B is never billed weekly, B2C never quarterly.
const PAYMENT_PERIOD_OPTIONS: Record<SubscriptionCustomerType, readonly PaymentPeriod[]> = {
    b2b: ["monthly", "quarterly", "yearly"],
    b2c: ["weekly", "monthly", "yearly"],
}

function rawValue(raw: RawSubscriptionSelection | URLSearchParams, key: keyof RawSubscriptionSelection) {
    return raw instanceof URLSearchParams ? raw.get(key) : raw[key]
}

export function getPaymentPeriodOptions(customerType: SubscriptionCustomerType) {
    return PAYMENT_PERIOD_OPTIONS[customerType]
}

export function getPaymentPeriodForCustomerType(customerType: SubscriptionCustomerType, period: PaymentPeriod): PaymentPeriod {
    return PAYMENT_PERIOD_OPTIONS[customerType].includes(period) ? period : "monthly"
}

function normalizeUsageValue(value: number, range: UsageRange) {
    const bounded = Math.min(Math.max(Number.isFinite(value) ? value : range.min, range.min), range.max)
    if (range.step <= 0) return bounded
    return Math.min(range.max, range.min + Math.round((bounded - range.min) / range.step) * range.step)
}

function parseUsage(raw: string | null | undefined, range: UsageRange & { default: number }, field: "workflowExecutions" | "aiTokens", issues: SubscriptionSelectionIssue[]) {
    if (raw == null || raw === "") return normalizeUsageValue(range.default, range)
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
        issues.push({ field, message: `${field} must be a non-negative integer.` })
        return normalizeUsageValue(range.default, range)
    }
    const parsed = Number(raw)
    if (parsed < range.min || parsed > range.max) issues.push({ field, message: `${field} must be between ${range.min} and ${range.max}.` })
    else if (range.step <= 0 || (parsed - range.min) % range.step !== 0) issues.push({ field, message: `${field} must use increments of ${range.step} starting at ${range.min}.` })
    return normalizeUsageValue(parsed, range)
}

export function resolveSubscriptionSelection(raw: RawSubscriptionSelection | URLSearchParams, config: SubscriptionSelectionCatalog) {
    const issues: SubscriptionSelectionIssue[] = []
    const rawCustomerType = rawValue(raw, "customerType")
    const customerType = CUSTOMER_TYPES.has(rawCustomerType as SubscriptionCustomerType) ? (rawCustomerType as SubscriptionCustomerType) : (config.defaults?.customerType ?? "b2c")
    if (rawCustomerType && rawCustomerType !== customerType) issues.push({ field: "customerType", message: "customerType must be b2b or b2c." })

    const rawPlan = rawValue(raw, "plan")
    const plan = PLANS.has(rawPlan as SubscriptionConfiguratorPlan) ? (rawPlan as SubscriptionConfiguratorPlan) : "custom"
    if (rawPlan && rawPlan !== plan) issues.push({ field: "plan", message: "plan must be pro, max, or custom." })

    const rawDeployment = rawValue(raw, "deploymentType") ?? rawValue(raw, "deployment")
    const deployment = DEPLOYMENTS.has(rawDeployment as SubscriptionDeploymentMode) ? (rawDeployment as SubscriptionDeploymentMode) : config.defaults?.deployment === "cloud" ? "cloud" : "self_hosted"
    if (rawDeployment && rawDeployment !== deployment) issues.push({ field: "deploymentType", message: "deploymentType must be cloud or self_hosted." })

    const rawPeriod = rawValue(raw, "paymentPeriod")
    const requestedPeriod = PAYMENT_PERIODS.has(rawPeriod as PaymentPeriod) ? (rawPeriod as PaymentPeriod) : (config.defaults?.paymentPeriod?.[customerType] ?? "monthly")
    if (rawPeriod && rawPeriod !== requestedPeriod) issues.push({ field: "paymentPeriod", message: "paymentPeriod must be weekly, monthly, quarterly, or yearly." })
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
        next.workflowExecutions = normalizeUsageValue(config.workflowExecutions[action.value].default, config.workflowExecutions[action.value])
        next.aiTokens = normalizeUsageValue(config.aiTokens[action.value].default, config.aiTokens[action.value])
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
