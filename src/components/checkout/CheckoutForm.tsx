"use client"

import type { CheckoutData } from "@/lib/cms"
import { Card } from "@/components/ui/Card"
import { normalizeCountryCode, resolveCraterCustomerType } from "@/lib/craterCustomer"
import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { Button } from "@code0-tech/pictor"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

type CheckoutErrorBody = {
    details?: unknown
    error?: unknown
    errorCode?: unknown
}

async function readCheckoutError(response: Response, fallback: string) {
    try {
        const body = (await response.json()) as CheckoutErrorBody
        const error = typeof body.error === "string" ? body.error : fallback
        const errorCode = typeof body.errorCode === "string" ? body.errorCode : null
        const details = Array.isArray(body.details) ? body.details.filter((detail): detail is string => typeof detail === "string") : []
        const context = [...(errorCode ? [`(${errorCode})`] : []), ...details]

        return context.length > 0 ? `${error} ${context.join(" ")}` : error
    } catch {
        return fallback
    }
}

function FormField({
    autoComplete,
    className,
    label,
    maxLength,
    name,
    placeholder,
    required,
    type = "text",
}: {
    autoComplete?: string
    className?: string
    label: string
    maxLength?: number
    name: string
    placeholder?: string
    required?: boolean
    type?: "email" | "tel" | "text"
}) {
    return (
        <label className={className}>
            <span className="mb-1.5 block text-xs font-medium text-secondary">{label}</span>
            <input
                autoComplete={autoComplete}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-tertiary hover:bg-white/8 focus:border-brand/40 focus:bg-white/8"
                maxLength={maxLength}
                name={name}
                placeholder={placeholder}
                required={required}
                type={type}
            />
        </label>
    )
}

export function CheckoutForm({ content }: { content?: CheckoutFormContent | null }) {
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const { error: sessionError, isLoading: isSessionLoading, token: sessionToken } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))

    if (!content) return null

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const formData = new FormData(event.currentTarget)
            if (!sessionToken) {
                throw new Error(sessionError ?? "A Crater session is required.")
            }

            const authorization = `Session ${sessionToken}`
            const customerResponse = await fetch("/api/crater/customer", {
                method: "POST",
                headers: {
                    Authorization: authorization,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerType,
                    name: formData.get("name"),
                    email: formData.get("email"),
                    phone: formData.get("phone"),
                    address: {
                        line1: formData.get("line1"),
                        line2: formData.get("line2"),
                        city: formData.get("city"),
                        state: formData.get("state"),
                        postalCode: formData.get("postalCode"),
                        country: normalizeCountryCode(formData.get("country")),
                    },
                    ...(customerType === "business"
                        ? {
                              taxIdType: formData.get("taxIdType"),
                              taxIdValue: formData.get("taxIdValue"),
                          }
                        : {}),
                }),
            })

            if (!customerResponse.ok) {
                throw new Error(await readCheckoutError(customerResponse, "Failed to create the billing customer."))
            }

            const checkoutPayload = Object.fromEntries(searchParams.entries())
            const checkoutResponse = await fetch("/api/crater/checkout/session", {
                method: "POST",
                headers: {
                    Authorization: authorization,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutPayload),
            })

            if (!checkoutResponse.ok) {
                throw new Error(await readCheckoutError(checkoutResponse, "Failed to create a Crater checkout session."))
            }

            const checkout: unknown = await checkoutResponse.json()
            const checkoutUrl = checkout && typeof checkout === "object" && "url" in checkout && typeof checkout.url === "string" ? checkout.url : null

            if (!checkoutUrl) {
                throw new Error("Crater returned no checkout redirect URL.")
            }

            window.location.assign(checkoutUrl)
        } catch (error) {
            console.error("Failed to start Crater checkout:", error)
            setErrorMessage(error instanceof Error ? error.message : content.paymentErrorFallback)
            setIsLoading(false)
        }
    }

    return (
        <Card variant="default" className="h-max! flex-1!">
            <form onSubmit={handleSubmit} className="flex-1 space-y-6">
                <h2 className="text-2xl text-white">{content.billingHeading}</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField className="sm:col-span-2" name="name" label={content.nameLabel} placeholder={content.namePlaceholder} autoComplete="name" required />
                    <FormField name="email" label={content.emailLabel} placeholder={content.emailPlaceholder} autoComplete="email" type="email" required />
                    <FormField name="phone" label={content.phoneLabel} placeholder={content.phonePlaceholder} autoComplete="tel" type="tel" />
                    <FormField className="sm:col-span-2" name="line1" label={content.line1Label} placeholder={content.line1Placeholder} autoComplete="address-line1" required />
                    <FormField className="sm:col-span-2" name="line2" label={content.line2Label} placeholder={content.line2Placeholder} autoComplete="address-line2" />
                    <FormField name="postalCode" label={content.postalCodeLabel} autoComplete="postal-code" required />
                    <FormField name="city" label={content.cityLabel} autoComplete="address-level2" required />
                    <FormField name="state" label={content.stateLabel} placeholder={content.statePlaceholder} autoComplete="address-level1" />
                    <FormField name="country" label={content.countryLabel} placeholder={content.countryPlaceholder} autoComplete="country" maxLength={2} required />

                    {customerType === "business" && (
                        <>
                            <FormField name="taxIdType" label={content.taxIdTypeLabel} placeholder={content.taxIdTypePlaceholder} required />
                            <FormField name="taxIdValue" label={content.taxIdValueLabel} placeholder={content.taxIdValuePlaceholder} required />
                        </>
                    )}
                </div>

                {(errorMessage || sessionError) && <div className="text-sm text-error">{errorMessage ?? sessionError}</div>}

                <Button
                    type="submit"
                    variant="normal"
                    disabled={isLoading || isSessionLoading || !sessionToken}
                    className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! transition-all duration-300 hover:bg-white!"
                >
                    {isLoading || isSessionLoading ? content.processingLabel : content.continueLabel}
                </Button>
            </form>
        </Card>
    )
}
