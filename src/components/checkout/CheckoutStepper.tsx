"use client"

import type { CheckoutData } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type CheckoutStepperContent = CheckoutData["stepper"]

type CheckoutStage = "billingAddress" | "payment"

const CheckoutStageContext = createContext<{ stage: CheckoutStage; setStage: (stage: CheckoutStage) => void } | null>(null)

export function CheckoutStageProvider({ children }: { children: ReactNode }) {
    const [stage, setStage] = useState<CheckoutStage>("billingAddress")
    const value = useMemo(() => ({ stage, setStage }), [stage])

    return <CheckoutStageContext.Provider value={value}>{children}</CheckoutStageContext.Provider>
}

export function useCheckoutStage() {
    const context = useContext(CheckoutStageContext)
    if (!context) throw new Error("useCheckoutStage must be used within a CheckoutStageProvider")
    return context
}

const CHECKOUT_STEPS = ["configuration", "billingAddress", "payment", "success"] as const
type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

export function CheckoutStepper({ content }: { content?: CheckoutStepperContent | null }) {
    const pathname = usePathname()
    const { stage } = useCheckoutStage()
    const currentStep: CheckoutStep = pathname?.endsWith("/checkout/success") ? "success" : stage
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep)
    const labels: Record<CheckoutStep, string> = {
        configuration: content?.configurationLabel || "Configuration",
        billingAddress: content?.billingAddressLabel || "Billing Address",
        payment: content?.paymentLabel || "Payment",
        success: content?.successLabel || "Success",
    }

    return (
        <ol className="flex items-center">
            {CHECKOUT_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex || currentStep === "success"
                const isCurrent = index === currentIndex && !isCompleted

                return (
                    <li key={step} className="flex items-center">
                        {index > 0 && <span aria-hidden="true" className={cn("mx-2 h-px w-4 sm:w-8", isCompleted ? "bg-brand/60" : "bg-white/10")} />}
                        <div className="flex items-center gap-1.5">
                            <div
                                className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors duration-200",
                                    isCompleted ? "border-brand bg-brand text-primary" : isCurrent ? "border-brand text-brand" : "border-white/15 text-tertiary"
                                )}
                            >
                                {isCompleted ? <IconCheck size={12} stroke={3} /> : index + 1}
                            </div>
                            <span className={cn("hidden text-sm font-medium whitespace-nowrap sm:inline", isCompleted || isCurrent ? "text-white" : "text-tertiary")}>{labels[step]}</span>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}
