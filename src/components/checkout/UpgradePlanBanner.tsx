"use client"

import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { Card } from "../ui/Card"
import { Button } from "@code0-tech/pictor"

export type SubscriptionPlan = "pro" | "max" | "custom"

const PLAN_ORDER: SubscriptionPlan[] = ["pro", "max", "custom"]

interface UpgradePlanBannerProps {
    content?: CheckoutData["upgradeBanner"] | null
    currentPlan?: string | null
    onUpgrade: (nextPlan: SubscriptionPlan) => void
    subscriptionConfig?: SubscriptionConfigData | null
}

export function UpgradePlanBanner({ content, currentPlan, onUpgrade, subscriptionConfig }: UpgradePlanBannerProps) {
    if (!content || !subscriptionConfig) return null

    const currentIndex = currentPlan ? PLAN_ORDER.indexOf(currentPlan.toLowerCase() as SubscriptionPlan) : -1
    const nextPlan = currentIndex >= 0 && currentIndex < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIndex + 1] : null
    if (!nextPlan) return null

    const nextPlanTitle = subscriptionConfig.packages[nextPlan].title
    const [textBeforePlan, textAfterPlan] = content.text.split("{plan}")

    return (
        <Card className="flex justify-between items-center gap-x-1.5 bg-linear-to-r from-brand/15 to-primary text-sm text-white bg-clip-padding">
            <span>
                {textBeforePlan}
                <span className="text-brand font-medium">{nextPlanTitle}</span>
                {textAfterPlan}
            </span>
            <Button variant="filled" onClick={() => onUpgrade(nextPlan)} className="bg-white/80! hover:bg-white! text-primary! py-1! px-2! rounded-lg!">
                {content.buttonLabel}
            </Button>
        </Card>
    )
}
