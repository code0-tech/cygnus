import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber } from "@/lib/formatters"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"

export type CheckoutSuccessSummary = {
    title: string
    rows: { id: string; label: string; value: string }[]
}

export function buildCheckoutSuccessSummary({
    checkoutContent,
    searchParams,
    subscriptionConfig,
}: {
    checkoutContent?: CheckoutData | null
    searchParams: URLSearchParams
    subscriptionConfig?: SubscriptionConfigData | null
}): CheckoutSuccessSummary | null {
    if (!checkoutContent?.summary || !subscriptionConfig || !searchParams.get("plan")) return null

    const { selection } = resolveSubscriptionSelection(searchParams, subscriptionConfig)
    const summary = checkoutContent.summary
    const rows = [
        { id: "plan", label: summary.pricing.planLabel, value: subscriptionConfig.packages[selection.plan].title },
        { id: "paymentPeriod", label: subscriptionConfig.paymentPeriod.label, value: subscriptionConfig.paymentPeriod[`${selection.paymentPeriod}Text`] },
    ]

    if (selection.plan === "custom") {
        rows.push(
            { id: "aiTokens", label: summary.aiTokensLabel, value: formatCompactNumber(selection.aiTokens) },
            { id: "workflowExecutions", label: summary.workflowExecutionsLabel, value: formatCompactNumber(selection.workflowExecutions) }
        )
    }

    return { title: summary.configurationLabel, rows }
}
