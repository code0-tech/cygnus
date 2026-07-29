"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { Card } from "@/components/ui/Card"
import type { CheckoutData } from "@/lib/cms"
import { normalizeCountryCode, resolveCraterCustomerType } from "@/lib/craterCustomer"
import { Button, EmailInput, emailValidation, TextInput, useForm } from "@code0-tech/pictor"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

interface CheckoutFormValues {
    city: string
    country: string
    email: string
    line1: string
    line2: string
    name: string
    phone: string
    postalCode: string
    state: string
    taxIdType: string
    taxIdValue: string
}

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

export function CheckoutForm({ content, onCustomerReady }: { content?: CheckoutFormContent | null; onCustomerReady?: () => Promise<void> }) {
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isCustomerReady, setIsCustomerReady] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const { error: sessionError, isLoading: isSessionLoading, token: sessionToken } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const initialValues = useMemo<CheckoutFormValues>(
        () => ({
            city: "",
            country: "",
            email: "",
            line1: "",
            line2: "",
            name: "",
            phone: "",
            postalCode: "",
            state: "",
            taxIdType: "",
            taxIdValue: "",
        }),
        []
    )
    const validation = useMemo(
        () => ({
            name: (value: string) => (value.trim() ? null : "Name is required"),
            email: (value: string) => {
                if (!value.trim()) return "Email is required"
                return emailValidation(value.trim()) ? null : "Please provide a valid email"
            },
            phone: () => null,
            line1: (value: string) => (value.trim() ? null : "Address is required"),
            line2: () => null,
            postalCode: (value: string) => (value.trim() ? null : "Postal code is required"),
            city: (value: string) => (value.trim() ? null : "City is required"),
            state: () => null,
            country: (value: string) => (value.trim().length === 2 ? null : "Please provide a two-letter country code"),
            taxIdType: (value: string) => (customerType === "business" && !value.trim() ? "Tax ID type is required" : null),
            taxIdValue: (value: string) => (customerType === "business" && !value.trim() ? "Tax ID is required" : null),
        }),
        [customerType]
    )

    const [inputs, validate] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: CheckoutFormValues) => {
            if (isLoading) return

            setIsLoading(true)
            setErrorMessage(null)

            void (async () => {
                try {
                    if (!sessionToken) {
                        throw new Error(sessionError ?? "A Crater session is required.")
                    }

                    const authorization = `Session ${sessionToken}`
                    if (!isCustomerReady) {
                        const customerResponse = await fetch("/api/crater/customer", {
                            method: "POST",
                            headers: {
                                Authorization: authorization,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                customerType,
                                name: values.name.trim(),
                                email: values.email.trim(),
                                phone: values.phone.trim(),
                                address: {
                                    line1: values.line1.trim(),
                                    line2: values.line2.trim(),
                                    city: values.city.trim(),
                                    state: values.state.trim(),
                                    postalCode: values.postalCode.trim(),
                                    country: normalizeCountryCode(values.country),
                                },
                                ...(customerType === "business"
                                    ? {
                                          taxIdType: values.taxIdType.trim(),
                                          taxIdValue: values.taxIdValue.trim(),
                                      }
                                    : {}),
                            }),
                        })

                        if (!customerResponse.ok) {
                            throw new Error(await readCheckoutError(customerResponse, "Failed to create the billing customer."))
                        }

                        if (onCustomerReady) {
                            await onCustomerReady()
                            setIsCustomerReady(true)
                            setIsLoading(false)
                            return
                        }
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
                    setErrorMessage(error instanceof Error ? error.message : content?.paymentErrorFallback || "Checkout failed.")
                    setIsLoading(false)
                }
            })()
        },
    })

    if (!content) return null

    return (
        <Card variant="default" className="h-max! flex-1!">
            <div className="flex-1 space-y-6">
                <h2 className="text-2xl text-white">{content.billingHeading}</h2>

                <fieldset disabled={isCustomerReady} className="grid grid-cols-1 gap-4 disabled:opacity-60 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <TextInput maxLength={256} title={content.nameLabel} placeholder={content.namePlaceholder} className="w-full!" {...inputs.getInputProps("name")} />
                    </div>
                    <EmailInput maxLength={512} title={content.emailLabel} placeholder={content.emailPlaceholder} className="w-full!" {...inputs.getInputProps("email")} />
                    <TextInput maxLength={50} title={content.phoneLabel} placeholder={content.phonePlaceholder} className="w-full!" {...inputs.getInputProps("phone")} />
                    <div className="sm:col-span-2">
                        <TextInput maxLength={100} title={content.line1Label} placeholder={content.line1Placeholder} className="w-full!" {...inputs.getInputProps("line1")} />
                    </div>
                    <div className="sm:col-span-2">
                        <TextInput maxLength={100} title={content.line2Label} placeholder={content.line2Placeholder} className="w-full!" {...inputs.getInputProps("line2")} />
                    </div>
                    <TextInput maxLength={50} title={content.postalCodeLabel} className="w-full!" {...inputs.getInputProps("postalCode")} />
                    <TextInput maxLength={100} title={content.cityLabel} className="w-full!" {...inputs.getInputProps("city")} />
                    <TextInput maxLength={100} title={content.stateLabel} placeholder={content.statePlaceholder} className="w-full!" {...inputs.getInputProps("state")} />
                    <TextInput maxLength={2} title={content.countryLabel} placeholder={content.countryPlaceholder} className="w-full!" {...inputs.getInputProps("country")} />

                    {customerType === "business" && (
                        <>
                            <TextInput maxLength={50} title={content.taxIdTypeLabel} placeholder={content.taxIdTypePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdType")} />
                            <TextInput maxLength={100} title={content.taxIdValueLabel} placeholder={content.taxIdValuePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdValue")} />
                        </>
                    )}
                </fieldset>

                {(errorMessage || sessionError) && <div className="text-sm text-error">{errorMessage ?? sessionError}</div>}

                <Button
                    type="submit"
                    variant="normal"
                    disabled={isLoading || isSessionLoading || !sessionToken}
                    onClick={() => validate()}
                    className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! transition-all duration-300 hover:bg-white!"
                >
                    {isLoading || isSessionLoading ? content.processingLabel : isCustomerReady ? content.payNowLabel : content.continueLabel}
                </Button>
            </div>
        </Card>
    )
}
