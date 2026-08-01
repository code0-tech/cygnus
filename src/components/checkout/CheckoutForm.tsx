"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { CountryPicker } from "@/components/checkout/CountryPicker"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import { createBillingDetailsValidation, createEmptyBillingDetails, getBillingStepStatus, type BillingDetails } from "@/lib/checkout/billingDetails"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { createCheckoutRedirect } from "@/lib/checkout/checkoutSubmission"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button, EmailInput, TextInput, useForm } from "@code0-tech/pictor"
import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]

interface CheckoutFormProps {
    content?: CheckoutFormContent | null
    locale: AppLocale
    mobileSteps?: boolean
    showHeading?: boolean
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

export function CheckoutForm({ content, locale, mobileSteps = false, showHeading = true }: CheckoutFormProps) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [mobileStep, setMobileStep] = useState(0)
    const { error: sessionError, isLoading: isSessionLoading, token: sessionToken } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const initialValues = useMemo(createEmptyBillingDetails, [])
    const validation = useMemo(() => createBillingDetailsValidation(customerType), [customerType])

    const [inputs, validate, values] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: BillingDetails) => {
            if (isLoading) return

            setIsLoading(true)
            setErrorMessage(null)
            setStage("payment")

            void (async () => {
                try {
                    if (!sessionToken) {
                        throw new Error(sessionError ?? "A Crater session is required.")
                    }

                    const checkoutUrl = await createCheckoutRedirect({ values, customerType, searchParams: new URLSearchParams(searchParams.toString()), sessionToken })
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
    const billingStatus = getBillingStepStatus(values, customerType)
    const hasTaxStep = billingStatus.hasTax
    const isContactComplete = billingStatus.contact
    const isAddressComplete = billingStatus.address
    const isTaxComplete = billingStatus.tax
    const isBillingFormComplete = billingStatus.complete

    const mobileLabels =
        locale === "de"
            ? { address: "Adresse", contact: "Kontaktdaten", next: "Weiter", tax: "Steuerangaben" }
            : { address: "Address", contact: "Contact details", next: "Continue", tax: "Tax details" }

    const contactFields = (
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <TextInput maxLength={256} title={content.nameLabel} placeholder={content.namePlaceholder} className="w-full!" {...inputs.getInputProps("name")} />
            </div>
            <EmailInput maxLength={512} title={content.emailLabel} placeholder={content.emailPlaceholder} className="w-full!" {...inputs.getInputProps("email")} />
            <TextInput maxLength={50} title={content.phoneLabel} placeholder={content.phonePlaceholder} className="w-full!" {...inputs.getInputProps("phone")} />
        </fieldset>
    )

    const addressFields = (
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
    )

    const taxFields = (
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput maxLength={50} title={content.taxIdTypeLabel} placeholder={content.taxIdTypePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdType")} />
            <TextInput maxLength={100} title={content.taxIdValueLabel} placeholder={content.taxIdValuePlaceholder} className="w-full!" {...inputs.getInputProps("taxIdValue")} />
        </fieldset>
    )

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
                            {contactFields}
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
                            {addressFields}
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
                                {taxFields}
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

                {contactFields}
                {addressFields}
                {hasTaxStep && taxFields}

                {(errorMessage || sessionError) && <div className="text-sm text-error">{errorMessage ?? sessionError}</div>}

                {submitButton}
            </div>
        </div>
    )
}
