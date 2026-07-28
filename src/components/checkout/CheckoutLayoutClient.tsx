"use client"

import { Card } from "@code0-tech/pictor"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { LandingContainer } from "@/components/ui/LandingContainer"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const appearance = {
    theme: "night" as const,
    inputs: "spaced" as const,
    labels: "floating" as const,
    variables: {
        colorPrimary: "#70ffb2",
        colorBackground: "#070514",
        colorText: "rgba(255, 255, 255, 0.75)",
        colorTextSecondary: "rgba(255, 255, 255, 0.5)",
        colorTextPlaceholder: "rgba(255, 255, 255, 0.5)",
        colorDanger: "#D90429",
        colorSuccess: "#29BF12",
        colorWarning: "#FFBE0B",
        colorIcon: "rgba(255, 255, 255, 0.5)",
        colorIconCardError: "#D90429",
        colorIconCardCvc: "rgba(255, 255, 255, 0.5)",
        borderRadius: "1rem",
        spacingUnit: "4px",
        fontSizeBase: "12.8px",
        fontFamily: "Inter, sans-serif",
    },
    rules: {
        ".Input": {
            backgroundColor: "rgba(7,5,20,0.92)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.24)",
            color: "#ffffff",
        },
        ".Input:hover": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.24)",
        },
        ".Input:focus": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.24)",
        },
        ".Input:autofill": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.24)",
            color: "#ffffff",
        },
        ".Input::placeholder": {
            color: "rgba(255,255,255,0.5)",
        },
        ".Input--invalid": {
            backgroundColor: "rgba(217,4,41,0.18)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(217,4,41,0.45)",
        },
        ".Label": {
            color: "rgba(255,255,255,0.5)",
            fontWeight: "500",
            fontSize: "11.2px",
            textTransform: "uppercase",
        },
        ".Tab": {
            backgroundColor: "rgba(255,255,255,0.16)",
            border: "none",
            borderRadius: "1rem",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
            color: "#ffffff",
        },
        ".Tab:hover": {
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.34)",
        },
        ".Tab--selected": {
            backgroundColor: "rgba(255,255,255,0.26)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.38)",
        },
        ".TabIcon": {
            color: "rgba(255,255,255,0.5)",
        },
        ".AccordionItem": {
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: "1rem",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.28)",
            color: "#ffffff",
        },
        ".AccordionItem:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.32)",
        },
        ".AccordionItem--selected": {
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.36)",
        },
        ".Block": {
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
        },
        ".CodeInput": {
            backgroundColor: "rgba(7,5,20,0.92)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.24)",
        },
        ".Error": {
            color: "#D90429",
        },
        ".Text": {
            color: "rgba(255,255,255,0.75)",
        },
    },
}

function CheckoutFallback({ isCustomPlan }: { isCustomPlan: boolean }) {
    return (
        <div className="flex flex-col gap-8">
            <div className="ml-3 h-7 w-22 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-full flex flex-col lg:flex-row gap-16">
                <div className="flex-1 min-w-0 h-max space-y-2 pl-3">
                    <div className="mb-5">
                        <div className="h-4 w-28 rounded bg-brand/15 animate-pulse" />
                        <div className="mt-4 h-8 w-64 rounded-lg bg-white/10 animate-pulse" />
                        <div className="mt-2 space-y-2">
                            <div className="h-4 w-full max-w-md rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-4/5 rounded bg-white/10 animate-pulse" />
                        </div>
                    </div>
                    {isCustomPlan && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 py-1">
                                <div className="size-10 rounded-xl bg-white/10 animate-pulse" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                                    <div className="h-4 w-12 rounded bg-white/10 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <div className="size-10 rounded-xl bg-white/10 animate-pulse" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                                    <div className="h-4 w-12 rounded bg-white/10 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <div className="size-10 rounded-xl bg-white/10 animate-pulse" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                                    <div className="h-4 w-12 rounded bg-white/10 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <div className="size-10 rounded-xl bg-white/10 animate-pulse" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                                    <div className="h-4 w-12 rounded bg-white/10 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/2 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <div className="border-b border-white/8 pb-3">
                            <div className="space-y-2">
                                <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                                <div className="h-4 w-56 rounded bg-white/10 animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
                                <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
                            </div>
                            {isCustomPlan && (
                                <>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                                        <div className="h-4 w-14 rounded bg-white/10 animate-pulse" />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                                        <div className="h-4 w-14 rounded bg-white/10 animate-pulse" />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
                            <div className="h-5 w-12 rounded bg-white/10 animate-pulse" />
                            <div className="h-6 w-24 rounded bg-brand/15 animate-pulse" />
                        </div>
                    </div>
                </div>
                <Card variant="filled" className="glass-card-shell p-6! flex-1! h-max! min-w-0">
                    <div aria-hidden="true" className="glass-card-tint" />
                    <div aria-hidden="true" className="glass-card-topline" />
                    <div className="flex-1 space-y-6">
                        <div className="h-7 w-52 rounded-lg bg-white/10 animate-pulse" />
                        <div className="space-y-4">
                            <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                        </div>
                        <div className="pt-10">
                            <div className="h-10 w-full rounded-xl bg-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] animate-pulse" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function CheckoutShell({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 bg-primary/50 backdrop-blur-sm border-b border-white/10">
                <Link href={"/"}>
                    <div className="mx-auto px-8 py-4">
                        <Image src="/code0_text_logo_white.png" alt="code0" width={100} height={100} className="w-32 h-8" loading="eager" />
                    </div>
                </Link>
            </div>
            <LandingContainer className="py-[12vh]">{children}</LandingContainer>
        </>
    )
}

export function CheckoutLayoutClient({ children, publishableKey }: { children: ReactNode; publishableKey: string }) {
    const searchParams = useSearchParams()
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])
    const plan = searchParams.get("plan")
    const isCustomPlan = plan !== "pro" && plan !== "max"

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const payload = Object.fromEntries(new URLSearchParams(window.location.search).entries())
                const response = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                })

                if (!response.ok) {
                    throw new Error("Failed to create payment intent.")
                }

                const json = await response.json()
                setClientSecret(json.clientSecret)
            } catch (error) {
                console.error("Failed to fetch client secret:", error)
            }
        }

        fetchClientSecret()
    }, [])

    if (!clientSecret) {
        return (
            <CheckoutShell>
                <CheckoutFallback isCustomPlan={isCustomPlan} />
            </CheckoutShell>
        )
    }

    return (
        <CheckoutShell>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                {children}
            </Elements>
        </CheckoutShell>
    )
}
