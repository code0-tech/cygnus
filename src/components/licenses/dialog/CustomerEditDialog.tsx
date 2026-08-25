"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { CustomerPaymentMethodCard, type CustomerPaymentMethodSummary } from "@/components/licenses/dialog/CustomerPaymentMethodCard"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { CheckoutData, ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { cn } from "@/lib/utils"
import { Button, DialogFooter, EmailInput, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, Text, TextInput } from "@code0-tech/pictor"
import { IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useCallback, useEffect, useState } from "react"

interface CustomerEditDialogProps {
    checkoutForm: CheckoutData["form"]
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    locale: AppLocale
}

type CustomerEditSection = "general" | "paymentMethods"

export function CustomerEditDialog({ checkoutForm, content, customerId, errors, locale }: CustomerEditDialogProps) {
    const router = useRouter()
    const { customers, updateCustomer } = useLicenseData()
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
    const [section, setSection] = useState<CustomerEditSection>("general")
    const [paymentMethods, setPaymentMethods] = useState<CustomerPaymentMethodSummary[] | null>(null)
    const [paymentMethodsError, setPaymentMethodsError] = useState(false)
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
    const [paymentMethodsRefreshKey, setPaymentMethodsRefreshKey] = useState(0)
    const [removingPaymentMethodId, setRemovingPaymentMethodId] = useState<string | null>(null)
    const [removePaymentMethodError, setRemovePaymentMethodError] = useState<string | null>(null)
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

    useEffect(() => {
        if (new URL(window.location.href).searchParams.has("setup_intent")) setSection("paymentMethods")
    }, [])

    useEffect(() => {
        if (section !== "paymentMethods" || !customer) return

        const controller = new AbortController()
        const url = new URL("/api/crater/customer/payment-methods", window.location.origin)
        url.searchParams.set("customerId", customer.id)
        setIsLoadingPaymentMethods(true)
        setPaymentMethodsError(false)
        setRemovePaymentMethodError(null)

        void fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("paymentMethods" in result)) throw new Error("Invalid payment methods response.")
                return result.paymentMethods as CustomerPaymentMethodSummary[]
            })
            .then(setPaymentMethods)
            .catch((loadError) => {
                if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setPaymentMethodsError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingPaymentMethods(false)
            })

        return () => controller.abort()
    }, [customer, paymentMethodsRefreshKey, section])

    const paymentMethodAdded = useCallback(() => {
        setPaymentMethodsRefreshKey((value) => value + 1)
    }, [])

    const removePaymentMethod = async (paymentMethodId: string) => {
        if (!customer || removingPaymentMethodId) return
        setRemovingPaymentMethodId(paymentMethodId)
        setRemovePaymentMethodError(null)

        try {
            const response = await fetch("/api/crater/customer/payment-methods/detach", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ customerId: customer.id, paymentMethodId }),
            })
            if (!response.ok) {
                const result: unknown = await response.json().catch(() => null)
                const errorCode = result && typeof result === "object" && "errorCode" in result ? result.errorCode : null
                throw new Error(errorCode === "PAYMENT_METHOD_IN_USE" ? errors.paymentMethodInUse : errors.paymentMethodRemove)
            }

            setPaymentMethods((current) => current?.filter((method) => method.id !== paymentMethodId) ?? null)
        } catch (removeError) {
            setRemovePaymentMethodError(removeError instanceof Error ? removeError.message : errors.paymentMethodRemove)
        } finally {
            setRemovingPaymentMethodId(null)
        }
    }

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

    const sidebar = (
        <div role="tablist" aria-label={content.editor.customerTitle} className="flex flex-col gap-2">
            {(["general", "paymentMethods"] as const).map((option) => {
                const selected = section === option
                const label = option === "general" ? content.editor.customerTitle : content.editor.paymentMethodHeading

                return (
                    <Button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        active={selected}
                        variant={selected ? "normal" : "none"}
                        paddingSize="xxs"
                        w="100%"
                        justify="start"
                        className={cn("text-base!", selected && "bg-white/5! shadow-[inset_0_1px_1px_#bfbfbf1a]!")}
                        onClick={() => setSection(option)}
                    >
                        {label}
                    </Button>
                )
            })}
        </div>
    )

    return (
        <LicenseDialog
            backLabel={content.editor.closeLabel}
            description={section === "general" ? content.editor.customerDescription : content.editor.paymentMethodDescription}
            onClose={close}
            sidebar={sidebar}
            title={content.editor.customerTitle}
        >
            {section === "general" ? (
                <div className="space-y-6" role="tabpanel">
                    <form id="customer-details-form" onSubmit={save} className="space-y-6">
                        <fieldset className="space-y-4">
                            <legend>
                                <Text size="sm" fw={500} hierarchy="secondary">
                                    {content.editor.contactHeading}
                                </Text>
                            </legend>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput title={checkoutForm.nameLabel} name="name" autoComplete="name" value={name} onChange={(event) => setName(event.currentTarget.value)} className="w-full!" />
                                <EmailInput
                                    title={checkoutForm.emailLabel}
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.currentTarget.value)}
                                    className="w-full!"
                                />
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
                    {error && (
                        <p role="alert" className="text-sm text-error">
                            {error}
                        </p>
                    )}
                    <DialogFooter className="gap-3! pt-2!">
                        <Button type="button" variant="none" onClick={close}>
                            {content.editor.closeLabel}
                        </Button>
                        <Button form="customer-details-form" type="submit" variant="filled" disabled={!customer || isSaving}>
                            {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                        </Button>
                    </DialogFooter>
                </div>
            ) : (
                <div className="space-y-6" role="tabpanel">
                    <ScrollArea h="32rem" type="scroll">
                        <ScrollAreaViewport className="h-full! w-full!">
                            <div className="space-y-3 pr-3">
                                {isLoadingPaymentMethods ? (
                                    <div role="status" className="space-y-3 animate-pulse motion-reduce:animate-none">
                                        <span className="sr-only">{content.editor.loadingPaymentMethodLabel}</span>
                                        <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                                        <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                                    </div>
                                ) : paymentMethodsError ? (
                                    <div className="space-y-3">
                                        <Text role="alert" size="sm" className="text-error!">
                                            {errors.paymentMethodRemove}
                                        </Text>
                                        <Button type="button" variant="normal" paddingSize="xs" onClick={() => setPaymentMethodsRefreshKey((value) => value + 1)}>
                                            {errors.retry}
                                        </Button>
                                    </div>
                                ) : paymentMethods && paymentMethods.length > 0 ? (
                                    paymentMethods.map((method) => (
                                        <CustomerPaymentMethodCard
                                            key={method.id}
                                            defaultLabel={content.editor.defaultPaymentMethodLabel}
                                            method={method}
                                            action={
                                                <Button
                                                    type="button"
                                                    variant="none"
                                                    paddingSize="xs"
                                                    disabled={removingPaymentMethodId === method.id}
                                                    onClick={() => void removePaymentMethod(method.id)}
                                                    aria-label={content.editor.removePaymentMethodLabel}
                                                >
                                                    {removingPaymentMethodId === method.id ? (
                                                        <ButtonLoader label={content.editor.removingPaymentMethodLabel} />
                                                    ) : (
                                                        <IconTrash aria-hidden="true" size={16} />
                                                    )}
                                                </Button>
                                            }
                                        />
                                    ))
                                ) : (
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.editor.noPaymentMethodsLabel}
                                    </Text>
                                )}
                            </div>
                        </ScrollAreaViewport>
                        <ScrollAreaScrollbar orientation="vertical" className="w-1.5!">
                            <ScrollAreaThumb className="bg-white/15! hover:bg-white/25!" />
                        </ScrollAreaScrollbar>
                    </ScrollArea>

                    {removePaymentMethodError && (
                        <Text role="alert" size="sm" className="text-error!">
                            {removePaymentMethodError}
                        </Text>
                    )}

                    {customer && (
                        <PaymentMethodSetupDialog
                            content={content}
                            errors={errors}
                            onSuccess={paymentMethodAdded}
                            owner={{ customerId: customer.id, type: "customer" }}
                            returnPath={`/${locale}/licenses/customer/${encodeURIComponent(customer.id)}/edit`}
                            triggerLabel={content.editor.addPaymentMethodLabel}
                        />
                    )}
                </div>
            )}
        </LicenseDialog>
    )
}
