"use client"

import type { CheckoutData } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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

const STEP_BUTTON_CLASS_NAME = "-mx-2 -my-1 flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 transition-colors"

export function CheckoutStepper({ content }: { content?: CheckoutStepperContent | null }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { stage, setStage } = useCheckoutStage()
    const isSuccessPage = Boolean(pathname?.endsWith("/checkout/success"))
    const currentStep: CheckoutStep = isSuccessPage ? "success" : stage
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep)
    const configurationUrl = searchParams.get("configurationUrl")
    const stepHref: Partial<Record<CheckoutStep, string>> = {
        configuration: configurationUrl ?? undefined,
    }
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
                const href = isCompleted ? stepHref[step] : undefined
                const returnsToBilling = step === "billingAddress" && currentStep === "payment"
                const stepIndicator = (
                    <>
                        <div
                            className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors duration-200",
                                isCompleted ? "border-white bg-white text-primary" : isCurrent ? "border-white text-white bg-white/10" : "border-white/20 text-tertiary"
                            )}
                        >
                            {isCompleted ? <IconCheck size={12} stroke={3} /> : index + 1}
                        </div>
                        <span className={cn("hidden text-sm font-medium whitespace-nowrap sm:inline", isCompleted || isCurrent ? "text-white" : "text-tertiary")}>{labels[step]}</span>
                    </>
                )

                return (
                    <li key={step} className="flex items-center">
                        {index > 0 && <span aria-hidden="true" className={cn("mx-2 h-px lg:w-7 xl:w-15", isCompleted ? "bg-white/60" : "bg-white/10")} />}
                        {returnsToBilling ? (
                            <button type="button" onClick={() => setStage("billingAddress")} className={cn(STEP_BUTTON_CLASS_NAME, "cursor-pointer hover:bg-white/10")}>
                                {stepIndicator}
                            </button>
                        ) : href ? (
                            <Link href={href} className={cn(STEP_BUTTON_CLASS_NAME, "hover:bg-white/10")}>
                                {stepIndicator}
                            </Link>
                        ) : (
                            <button type="button" disabled className={cn(STEP_BUTTON_CLASS_NAME, "cursor-not-allowed")}>
                                {stepIndicator}
                            </button>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
