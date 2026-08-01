"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { CountryPicker } from "@/components/checkout/CountryPicker"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { normalizeCountryCode, resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { normalizeCheckoutSelection } from "@/lib/checkout/checkoutValidation"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button, EmailInput, emailValidation, TextInput, useForm } from "@code0-tech/pictor"
import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"

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

interface CheckoutFormProps {
    content?: CheckoutFormContent | null
    locale: AppLocale
    mobileSteps?: boolean
    showHeading?: boolean
    subscriptionConfig?: SubscriptionConfigData | null
}

interface MobileCheckoutStepProps {
    canOpen: boolean
    children: ReactNode
    complete: boolean
    number: number
    onOpen: () => void
    open: boolean
    title: string
}

function MobileCheckoutStep({ canOpen, children, complete, number, onOpen, open, title }: MobileCheckoutStepProps) {
    const contentId = `checkout-form-step-${number}`

    return (
        <section className={cn("overflow-hidden rounded-2xl border transition-colors", open ? "border-white/15 bg-white/5" : "border-white/10 bg-white/2")}>
            <button
                type="button"
                aria-controls={contentId}
                aria-expanded={open}
                disabled={!canOpen}
                onClick={onOpen}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left outline-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30"
            >
                <span
                    className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                        complete ? "border-brand bg-brand text-primary" : open ? "border-brand text-brand" : "border-white/15 text-tertiary"
                    )}
                >
                    {complete ? <IconCheck aria-hidden="true" size={14} stroke={3} /> : number}
                </span>
                <span className={cn("min-w-0 flex-1 text-sm font-medium", open || complete ? "text-white" : "text-tertiary")}>{title}</span>
                <IconChevronDown aria-hidden="true" size={18} className={cn("shrink-0 text-tertiary transition-transform", open && "rotate-180")} />
            </button>
            <div
                id={contentId}
                aria-hidden={!open}
                inert={!open}
                className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-white/10 px-4 pt-5 pb-4">{children}</div>
                </div>
            </div>
        </section>
    )
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

export function CheckoutForm({ content, locale, mobileSteps = false, showHeading = true, subscriptionConfig }: CheckoutFormProps) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [mobileStep, setMobileStep] = useState(0)
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

    const [inputs, validate, values] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: CheckoutFormValues) => {
            if (isLoading) return

            setIsLoading(true)
            setErrorMessage(null)
            setStage("payment")

            void (async () => {
                try {
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

                    const checkoutPayload = Object.fromEntries(searchParams.entries())
                    const normalizedCheckoutPayload = subscriptionConfig ? normalizeCheckoutSelection(checkoutPayload, subscriptionConfig) : checkoutPayload
                    const checkoutResponse = await fetch("/api/crater/checkout/session", {
                        method: "POST",
                        headers: {
                            Authorization: authorization,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(normalizedCheckoutPayload),
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
                    setStage("billingAddress")
                }
            })()
        },
    })

    if (!content) return null
    const countryInputProps = inputs.getInputProps("country")
    const hasTaxStep = customerType === "business"
    const isContactComplete = Boolean(values.name.trim()) && emailValidation(values.email.trim())
    const isAddressComplete = Boolean(values.line1.trim() && values.postalCode.trim() && values.city.trim()) && values.country.trim().length === 2
    const isTaxComplete = !hasTaxStep || Boolean(values.taxIdType.trim() && values.taxIdValue.trim())
    const isBillingFormComplete = isContactComplete && isAddressComplete && isTaxComplete
    const mobileLabels =
        locale === "de"
            ? { address: "Adresse", contact: "Kontaktdaten", next: "Weiter", tax: "Steuerangaben" }
            : { address: "Address", contact: "Contact details", next: "Continue", tax: "Tax details" }

    const submitButton = (
        <Button
            type="submit"
            variant="normal"
            disabled={!isBillingFormComplete || isLoading || isSessionLoading || !sessionToken}
            onClick={() => validate()}
            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! transition-all duration-300 hover:bg-white!"
        >
            {isLoading || isSessionLoading ? content.processingLabel : content.continueLabel}
        </Button>
    )
    const mobileSubmit = <div className="z-10 -mx-4 shrink-0 bg-primary px-4 pt-4 pb-2 sm:-mx-6 sm:px-6">{submitButton}</div>

    if (mobileSteps) {
        return (
            <div className="flex min-h-0 flex-1 flex-col">
                {showHeading && <h2 className="mb-6 text-2xl text-white">{content.billingHeading}</h2>}

                <div className="min-h-0 flex-1 overflow-y-auto pb-3">
                    <div className="space-y-3">
                        <MobileCheckoutStep canOpen complete={isContactComplete} number={1} onOpen={() => setMobileStep(0)} open={mobileStep === 0} title={mobileLabels.contact}>
                            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <TextInput maxLength={256} title={content.nameLabel} placeholder={content.namePlaceholder} className="w-full!" {...inputs.getInputProps("name")} />
                                </div>
                                <EmailInput maxLength={512} title={content.emailLabel} placeholder={content.emailPlaceholder} className="w-full!" {...inputs.getInputProps("email")} />
                                <TextInput maxLength={50} title={content.phoneLabel} placeholder={content.phonePlaceholder} className="w-full!" {...inputs.getInputProps("phone")} />
                            </fieldset>
                            <Button
                                type="button"
                                variant="normal"
                                disabled={!isContactComplete}
                                onClick={() => setMobileStep(1)}
                                className="mt-5 h-10! w-full! bg-white/80! text-sm! text-primary! hover:bg-white!"
                            >
                                {mobileLabels.next}
                            </Button>
                        </MobileCheckoutStep>

                        <MobileCheckoutStep canOpen={isContactComplete} complete={isAddressComplete} number={2} onOpen={() => setMobileStep(1)} open={mobileStep === 1} title={mobileLabels.address}>
                            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <TextInput maxLength={100} title={content.line1Label} placeholder={content.line1Placeholder} className="w-full!" {...inputs.getInputProps("line1")} />
                                </div>
                                <div className="sm:col-span-2">
                                    <TextInput maxLength={100} title={content.line2Label} placeholder={content.line2Placeholder} className="w-full!" {...inputs.getInputProps("line2")} />
                                </div>
                                <TextInput maxLength={50} title={content.postalCodeLabel} className="w-full!" {...inputs.getInputProps("postalCode")} />
                                <TextInput maxLength={100} title={content.cityLabel} className="w-full!" {...inputs.getInputProps("city")} />
                                <TextInput maxLength={100} title={content.stateLabel} placeholder={content.statePlaceholder} className="w-full!" {...inputs.getInputProps("state")} />
                                <CountryPicker
                                    emptyLabel={content.countryEmptyLabel}
                                    errorMessage={countryInputProps.formValidation?.notValidMessage}
                                    label={content.countryLabel}
                                    locale={locale}
                                    onValueChange={(countryCode) => countryInputProps.formValidation?.setValue?.(countryCode)}
                                    placeholder={content.countryPlaceholder}
                                    required={countryInputProps.required}
                                    value={values.country}
                                />
                            </fieldset>
                            {hasTaxStep && (
                                <Button
                                    type="button"
                                    variant="normal"
                                    disabled={!isAddressComplete}
                                    onClick={() => setMobileStep(2)}
                                    className="mt-5 h-10! w-full! bg-white/80! text-sm! text-primary! hover:bg-white!"
                                >
                                    {mobileLabels.next}
                                </Button>
                            )}
                        </MobileCheckoutStep>

                        {hasTaxStep && (
                            <MobileCheckoutStep
                                canOpen={isContactComplete && isAddressComplete}
                                complete={isTaxComplete}
                                number={3}
                                onOpen={() => setMobileStep(2)}
                                open={mobileStep === 2}
                                title={mobileLabels.tax}
                            >
                                <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <TextInput maxLength={50} title={content.taxIdTypeLabel} placeholder={content.taxIdTypePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdType")} />
                                    <TextInput
                                        maxLength={100}
                                        title={content.taxIdValueLabel}
                                        placeholder={content.taxIdValuePlaceholder}
                                        className="w-full!"
                                        {...inputs.getInputProps("taxIdValue")}
                                    />
                                </fieldset>
                            </MobileCheckoutStep>
                        )}
                    </div>

                    {(errorMessage || sessionError) && <div className="mt-4 text-sm text-error">{errorMessage ?? sessionError}</div>}
                </div>

                {mobileStep === (hasTaxStep ? 2 : 1) && mobileSubmit}
            </div>
        )
    }

    return (
        <div className="h-max! flex-1! flex flex-col">
            <div className="flex-1 space-y-6">
                {showHeading && <h2 className="text-2xl text-white">{content.billingHeading}</h2>}

                <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <CountryPicker
                        emptyLabel={content.countryEmptyLabel}
                        errorMessage={countryInputProps.formValidation?.notValidMessage}
                        label={content.countryLabel}
                        locale={locale}
                        onValueChange={(countryCode) => countryInputProps.formValidation?.setValue?.(countryCode)}
                        placeholder={content.countryPlaceholder}
                        required={countryInputProps.required}
                        value={values.country}
                    />

                    {customerType === "business" && (
                        <>
                            <TextInput maxLength={50} title={content.taxIdTypeLabel} placeholder={content.taxIdTypePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdType")} />
                            <TextInput maxLength={100} title={content.taxIdValueLabel} placeholder={content.taxIdValuePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdValue")} />
                        </>
                    )}
                </fieldset>

                {(errorMessage || sessionError) && <div className="text-sm text-error">{errorMessage ?? sessionError}</div>}

                {submitButton}
            </div>
        </div>
    )
}
