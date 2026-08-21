import type { CheckoutPricingOverviewData } from "@/components/checkout/CheckoutPricingOverview"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"

export type CheckoutSuccessSummary = {
    deployment: "self_hosted" | "cloud"
    overview?: CheckoutPricingOverviewData
}

export function buildCheckoutSuccessSummary({
    checkoutContent,
    searchParams,
    subscriptionConfig,
    subscriptionPrices,
}: {
    checkoutContent?: CheckoutData | null
    searchParams: URLSearchParams
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices?: SubscriptionPriceCatalog | null
}): CheckoutSuccessSummary | null {
    if (!checkoutContent?.summary || !subscriptionConfig || !searchParams.get("plan")) return null

    const { selection } = resolveSubscriptionSelection(searchParams, subscriptionConfig)
    const summary = checkoutContent.summary
    const resolvedPricing = subscriptionPrices
        ? resolveCheckoutPricing({
              aiTokensParam: searchParams.get("aiTokens"),
              customerTypeParam: selection.customerType,
              fallbackPeriodSuffix: summary.pricing.perMonthSuffix,
              paymentPeriodParam: selection.paymentPeriod,
              planParam: selection.plan,
              subscriptionConfig,
              subscriptionPrices,
              workflowExecutionsParam: searchParams.get("workflowExecutions"),
          })
        : null
    const paymentPeriodDiscountAmount = resolvedPricing ? Math.max(0, resolvedPricing.pricing.totalBeforeDiscount - resolvedPricing.pricing.totalPrice) : 0
    const paymentPeriodDiscountPercentage = resolvedPricing && resolvedPricing.pricing.totalBeforeDiscount > 0 ? paymentPeriodDiscountAmount / resolvedPricing.pricing.totalBeforeDiscount : 0
    const paymentPeriodDiscountLabel =
        selection.paymentPeriod === "quarterly" ? summary.pricing.quarterlyDiscountLabel : selection.paymentPeriod === "yearly" ? summary.pricing.yearlyDiscountLabel : null
    return {
        deployment: selection.deployment,
        overview: resolvedPricing
            ? {
                  aiTokenPrice: resolvedPricing.pricing.aiTokenPrice,
                  aiTokens: resolvedPricing.aiTokens,
                  customerType: selection.customerType,
                  deployment: selection.deployment,
                  isCustomPlan: resolvedPricing.isCustomPlan,
                  monthlyPeriodSuffix: subscriptionConfig.paymentPeriod.monthlyPeriodSuffix,
                  paymentPeriodDiscountAmount,
                  paymentPeriodDiscountLabel,
                  paymentPeriodDiscountPercentage,
                  periodSuffix: resolvedPricing.periodSuffix,
                  planPrice: resolvedPricing.planPrice,
                  planTitle: resolvedPricing.planTitle,
                  taxAmount: 0,
                  taxPercentage: null,
                  totalPrice: resolvedPricing.pricing.totalPrice,
                  workflowExecutionPrice: resolvedPricing.pricing.workflowExecutionPrice,
                  workflowExecutions: resolvedPricing.workflowExecutions,
              }
            : undefined,
    }
}
