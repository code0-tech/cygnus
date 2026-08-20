"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { CheckoutData, ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, DialogFooter, EmailInput, Text, TextInput } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"

interface CustomerEditDialogProps {
    checkoutForm: CheckoutData["form"]
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    locale: AppLocale
}

export function CustomerEditDialog({ checkoutForm, content, customerId, errors, locale }: CustomerEditDialogProps) {
    const router = useRouter()
    const { customers, reload, updateCustomer } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [line1, setLine1] = useState("")
    const [line2, setLine2] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [country, setCountry] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}`)

    useEffect(() => {
        if (!customer) return
        setName(customer.name ?? "")
        setEmail(customer.email ?? "")
        setPhone(customer.phone ?? "")
        setLine1(customer.address?.line1 ?? "")
        setLine2(customer.address?.line2 ?? "")
        setCity(customer.address?.city ?? "")
        setState(customer.address?.state ?? "")
        setPostalCode(customer.address?.postalCode ?? "")
        setCountry(customer.address?.country ?? "")
    }, [customer])

    const save = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault()
        if (!customer || isSaving) return
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/customer", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    id: customer.id,
                    name: name.trim() || null,
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    address: {
                        line1: line1.trim() || null,
                        line2: line2.trim() || null,
                        city: city.trim() || null,
                        state: state.trim() || null,
                        postalCode: postalCode.trim() || null,
                        country: country.trim().toUpperCase() || null,
                    },
                }),
            })
            if (!response.ok) throw new Error(errors.customerUpdate)

            updateCustomer(customer.id, {
                address: {
                    city: city.trim() || undefined,
                    country: country.trim().toUpperCase() || undefined,
                    line1: line1.trim() || undefined,
                    line2: line2.trim() || undefined,
                    postalCode: postalCode.trim() || undefined,
                    state: state.trim() || undefined,
                },
                email: email.trim() || undefined,
                name: name.trim() || undefined,
                phone: phone.trim() || undefined,
            })
            close()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : errors.customerUpdate)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <LicenseDialog backLabel={content.editor.cancelLabel} description={content.editor.customerDescription} onClose={close} title={content.editor.customerTitle}>
            <div className="space-y-6">
                <form id="customer-details-form" onSubmit={save} className="space-y-6">
                    <fieldset className="space-y-4">
                        <legend>
                            <Text size="sm" fw={500} hierarchy="secondary">
                                {content.editor.contactHeading}
                            </Text>
                        </legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextInput title={checkoutForm.nameLabel} name="name" autoComplete="name" value={name} onChange={(event) => setName(event.currentTarget.value)} className="w-full!" />
                            <EmailInput title={checkoutForm.emailLabel} name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} className="w-full!" />
                            <TextInput
                                title={checkoutForm.phoneLabel}
                                name="phone"
                                autoComplete="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.currentTarget.value)}
                                className="w-full! sm:col-span-2"
                            />
                        </div>
                    </fieldset>

                    <fieldset className="space-y-4">
                        <legend>
                            <Text size="sm" fw={500} hierarchy="secondary">
                                {checkoutForm.billingHeading}
                            </Text>
                        </legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextInput
                                title={checkoutForm.line1Label}
                                name="address-line1"
                                autoComplete="address-line1"
                                value={line1}
                                onChange={(event) => setLine1(event.currentTarget.value)}
                                className="w-full! sm:col-span-2"
                            />
                            <TextInput
                                title={checkoutForm.line2Label}
                                name="address-line2"
                                autoComplete="address-line2"
                                value={line2}
                                onChange={(event) => setLine2(event.currentTarget.value)}
                                className="w-full! sm:col-span-2"
                            />
                            <TextInput
                                title={checkoutForm.postalCodeLabel}
                                name="postal-code"
                                autoComplete="postal-code"
                                value={postalCode}
                                onChange={(event) => setPostalCode(event.currentTarget.value)}
                                className="w-full!"
                            />
                            <TextInput
                                title={checkoutForm.cityLabel}
                                name="address-level2"
                                autoComplete="address-level2"
                                value={city}
                                onChange={(event) => setCity(event.currentTarget.value)}
                                className="w-full!"
                            />
                            <TextInput
                                title={checkoutForm.stateLabel}
                                name="address-level1"
                                autoComplete="address-level1"
                                value={state}
                                onChange={(event) => setState(event.currentTarget.value)}
                                className="w-full!"
                            />
                            <TextInput
                                title={checkoutForm.countryLabel}
                                name="country"
                                autoComplete="country"
                                maxLength={2}
                                pattern="[A-Za-z]{2}"
                                value={country}
                                onChange={(event) => setCountry(event.currentTarget.value)}
                                className="w-full! uppercase"
                            />
                        </div>
                    </fieldset>
                </form>

                <fieldset className="space-y-3">
                    <legend>
                        <Text size="sm" fw={500} hierarchy="secondary">
                            {content.editor.paymentMethodHeading}
                        </Text>
                    </legend>
                    <Text size="sm" hierarchy="tertiary">
                        {content.editor.paymentMethodDescription}
                    </Text>
                    {customer ? <PaymentMethodSetupDialog content={content} customerId={customer.id} disabled={isSaving} errors={errors} locale={locale} onSuccess={reload} /> : null}
                </fieldset>
                {error && (
                    <p role="alert" className="text-sm text-error">
                        {error}
                    </p>
                )}
                <DialogFooter className="gap-3! pt-2!">
                    <Button type="button" variant="none" onClick={close}>
                        {content.editor.cancelLabel}
                    </Button>
                    <Button form="customer-details-form" type="submit" variant="filled" disabled={!customer || isSaving}>
                        {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                    </Button>
                </DialogFooter>
            </div>
        </LicenseDialog>
    )
}
