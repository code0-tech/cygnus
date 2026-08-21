"use client"

import type { SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import { Card } from "../ui/Card"
import { Button } from "@code0-tech/pictor"

export type SubscriptionPlan = "pro" | "max" | "custom"

interface UpgradePlanBannerProps {
    content?: UpgradeBannerData | null
    currentPlan?: string | null
    onUpgrade: (nextPlan: SubscriptionPlan) => void
    showPlanSpecificActions?: boolean
    subscriptionConfig?: SubscriptionConfigData | null
}

export function UpgradePlanBanner({ content, currentPlan, onUpgrade, showPlanSpecificActions = false, subscriptionConfig }: UpgradePlanBannerProps) {
    if (!content || !subscriptionConfig) return null

    const plan = currentPlan?.toLowerCase()
    if (plan !== "pro" && plan !== "max" && plan !== "custom") return null
    if (plan !== "pro" && !showPlanSpecificActions) return null

    const nextPlan: SubscriptionPlan = plan === "pro" ? "max" : "custom"
    const planTitle = subscriptionConfig.packages[nextPlan].title
    const planContent = content[plan]
    const renderWithPlan = (value: string) => {
        const [before, ...after] = value.split("{plan}")
        if (after.length === 0) return value
        return (
            <>
                {before}
                <span className="font-medium" style={{ color: planContent.gradientFrom }}>
                    {planTitle}
                </span>
                {after.join("{plan}")}
            </>
        )
    }

    return (
        <Card
            className="flex items-center justify-between gap-x-1.5 text-sm text-white bg-clip-padding"
            style={{ backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${planContent.gradientFrom} 15%, transparent), ${planContent.gradientTo})` }}
        >
            <span>{renderWithPlan(planContent.text)}</span>
            <Button variant="filled" onClick={() => onUpgrade(nextPlan)} className="bg-white/80! hover:bg-white! text-primary! py-1! px-2! rounded-lg!">
                {renderWithPlan(planContent.buttonLabel)}
            </Button>
        </Card>
    )
}
