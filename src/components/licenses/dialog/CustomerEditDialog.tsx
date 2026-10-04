"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { CustomerPaymentMethodCard, CustomerPaymentMethodCardSkeleton } from "@/components/licenses/dialog/CustomerPaymentMethodCard"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSaveButton, LicenseTabSection } from "@/components/licenses/dialog/LicenseTabLayout"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import { useCustomerPaymentMethods } from "@/hooks/usePaymentMethods"
import type { CheckoutData, ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { type CustomerEditSection, getCustomerEditSectionLabels } from "@/lib/licenses/editSections"
import { createLicenseCustomerPath, resolveCustomerRouteId } from "@/lib/licenses/licenseRoute"
import { Button, EmailInput, Spacing, TabContent, TabList, TabTrigger, Text, TextInput } from "@code0-tech/pictor"
import { IconCreditCard, IconMail, IconPhone, IconTrash, IconUser } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, type ReactNode, type SyntheticEvent, useEffect, useState } from "react"

interface CustomerEditDialogProps {
    checkoutForm: CheckoutData["form"]
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    locale: AppLocale
}

interface CustomerField {
    autoComplete: string
    className?: string
    description: string
    maxLength?: number
    name: string
    onChange: (value: string) => void
    pattern?: string
    title: string
    type?: "email"
    left?: ReactNode
    leftType?: "icon"
    value: string
}

export function CustomerEditDialog({ checkoutForm, content, customerId, errors, locale }: CustomerEditDialogProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { customers, updateCustomer } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
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
    const requestedTab = searchParams.get("tab")
    const section: CustomerEditSection = requestedTab === "paymentMethods" || (requestedTab !== "general" && searchParams.has("setup_intent")) ? "paymentMethods" : "general"
    const sectionLabels = getCustomerEditSectionLabels(content.editor)
    const { isLoadingPaymentMethods, paymentMethods, paymentMethodsError, refreshPaymentMethods, removePaymentMethodLocally } = useCustomerPaymentMethods(customer?.id, section === "paymentMethods")
    const [removingPaymentMethodId, setRemovingPaymentMethodId] = useState<string | null>(null)
    const [removePaymentMethodError, setRemovePaymentMethodError] = useState<string | null>(null)
    const close = () => router.replace(createLicenseCustomerPath(locale, resolvedCustomerId))

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

    const setSection = (nextSection: CustomerEditSection) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("tab", nextSection)
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
    }

    const paymentMethodAdded = () => {
        setRemovePaymentMethodError(null)
        refreshPaymentMethods()
    }

    const removePaymentMethod = async (paymentMethodId: string) => {
        if (!customer || !paymentMethods || removingPaymentMethodId) return
        setRemovingPaymentMethodId(paymentMethodId)
        setRemovePaymentMethodError(null)

        try {
            const response = await fetch("/api/crater/customer", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: customer.id, paymentMethods: paymentMethods.filter((method) => method.id !== paymentMethodId).map((method) => method.id) }),
            })
            if (!response.ok) {
                const result: unknown = await response.json().catch(() => null)
                const errorCode = result && typeof result === "object" && "errorCode" in result ? result.errorCode : null
                throw new Error(errorCode === "PAYMENT_METHOD_IN_USE" ? errors.paymentMethodInUse : errors.paymentMethodRemove)
            }

            removePaymentMethodLocally(paymentMethodId)
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

    const fieldDescriptions = content.editor.fieldDescriptions
    const contactFields: CustomerField[] = [
        { autoComplete: "name", description: fieldDescriptions.name, name: "name", onChange: setName, title: checkoutForm.nameLabel, value: name },
        {
            autoComplete: "email",
            description: fieldDescriptions.email,
            name: "email",
            onChange: setEmail,
            title: checkoutForm.emailLabel,
            type: "email",
            value: email,
            left: <IconMail aria-hidden="true" size={16} />,
            leftType: "icon",
        },
        {
            autoComplete: "tel",
            description: fieldDescriptions.phone,
            name: "phone",
            onChange: setPhone,
            title: checkoutForm.phoneLabel,
            value: phone,
            left: <IconPhone aria-hidden="true" size={16} />,
            leftType: "icon",
        },
    ]
    const billingFields: CustomerField[] = [
        { autoComplete: "address-line1", description: fieldDescriptions.line1, name: "address-line1", onChange: setLine1, title: checkoutForm.line1Label, value: line1 },
        { autoComplete: "address-line2", description: fieldDescriptions.line2, name: "address-line2", onChange: setLine2, title: checkoutForm.line2Label, value: line2 },
        { autoComplete: "postal-code", description: fieldDescriptions.postalCode, name: "postal-code", onChange: setPostalCode, title: checkoutForm.postalCodeLabel, value: postalCode },
        { autoComplete: "address-level2", description: fieldDescriptions.city, name: "address-level2", onChange: setCity, title: checkoutForm.cityLabel, value: city },
        { autoComplete: "address-level1", description: fieldDescriptions.state, name: "address-level1", onChange: setState, title: checkoutForm.stateLabel, value: state },
        {
            autoComplete: "country",
            className: "uppercase",
            description: fieldDescriptions.country,
            maxLength: 2,
            name: "country",
            onChange: setCountry,
            pattern: "[A-Za-z]{2}",
            title: checkoutForm.countryLabel,
            value: country,
        },
    ]
    const renderFields = (fields: CustomerField[]) =>
        fields.map(({ onChange, type, ...field }, index) => {
            const Input = type === "email" ? EmailInput : TextInput

            return (
                <Fragment key={field.name}>
                    {index > 0 ? <Spacing spacing="md" /> : null}
                    <Input w="100%" {...field} onChange={(event) => onChange(event.currentTarget.value)} />
                </Fragment>
            )
        })

    const sectionIcons = { general: IconUser, paymentMethods: IconCreditCard } satisfies Record<CustomerEditSection, typeof IconUser>
    const sidebar = (
        <TabList aria-label={content.editor.customerTitle}>
            {(["general", "paymentMethods"] as const).map((value) => {
                const TabIcon = sectionIcons[value]

                return (
                    <TabTrigger key={value} value={value} w="100%" asChild>
                        <Button type="button" paddingSize="xxs" variant="none" justify="start" className="rounded-2xl! h-8!">
                            <TabIcon aria-hidden="true" size={13} />
                            <Text className="truncate" size="md">
                                {sectionLabels[value]}
                            </Text>
                        </Button>
                    </TabTrigger>
                )
            })}
        </TabList>
    )

    return (
        <LicenseDialog
            backLabel={content.editor.closeLabel}
            description={section === "general" ? content.editor.customerDescription : content.editor.paymentMethodDescription}
            onClose={close}
            onValueChange={(value) => (value === "general" || value === "paymentMethods") && setSection(value)}
            sidebar={sidebar}
            title={content.editor.customerTitle}
            value={section}
        >
            <TabContent value="general">
                <LicenseTabHeader
                    title={sectionLabels.general}
                    description={content.editor.customerDescription}
                    action={
                        <LicenseTabSaveButton form="customer-details-form" type="submit" disabled={!customer || isSaving}>
                            {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                        </LicenseTabSaveButton>
                    }
                />
                {error ? <LicenseTabAlert>{error}</LicenseTabAlert> : null}
                <form id="customer-details-form" onSubmit={save}>
                    <Spacing spacing="xl" />
                    <Text size="md" hierarchy="secondary">
                        {content.editor.contactHeading}
                    </Text>
                    <Spacing spacing="md" />
                    {renderFields(contactFields)}
                    <Spacing spacing="xl" />
                    <Text size="md" hierarchy="secondary">
                        {checkoutForm.billingHeading}
                    </Text>
                    <Spacing spacing="md" />
                    {renderFields(billingFields)}
                </form>
            </TabContent>
            <TabContent value="paymentMethods">
                <LicenseTabHeader
                    title={sectionLabels.paymentMethods}
                    description={content.editor.paymentMethodDescription}
                    action={
                        customer ? (
                            <PaymentMethodSetupDialog
                                content={content}
                                errors={errors}
                                onSuccess={paymentMethodAdded}
                                owner={{ customerId: customer.id }}
                                returnPath={`${createLicenseCustomerPath(locale, customer.id)}/edit`}
                                triggerLabel={content.editor.addPaymentMethodLabel}
                            />
                        ) : null
                    }
                />
                {removePaymentMethodError ? <LicenseTabAlert>{removePaymentMethodError}</LicenseTabAlert> : null}

                <LicenseTabSection>
                    {isLoadingPaymentMethods ? (
                        <>
                            <CustomerPaymentMethodCardSkeleton label={content.editor.loadingPaymentMethodLabel} />
                            <CustomerPaymentMethodCardSkeleton />
                        </>
                    ) : paymentMethodsError ? (
                        <LicenseTabRow
                            description={<span className="text-error">{errors.paymentMethodLoad}</span>}
                            action={
                                <Button type="button" variant="normal" paddingSize="xxs" onClick={refreshPaymentMethods}>
                                    {errors.retry}
                                </Button>
                            }
                        />
                    ) : paymentMethods && paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => (
                            <CustomerPaymentMethodCard
                                key={method.id}
                                method={method}
                                action={
                                    <Button
                                        type="button"
                                        variant="none"
                                        paddingSize="xxs"
                                        disabled={removingPaymentMethodId === method.id}
                                        onClick={() => void removePaymentMethod(method.id)}
                                        aria-label={content.editor.removePaymentMethodLabel}
                                    >
                                        {removingPaymentMethodId === method.id ? <ButtonLoader label={content.editor.removingPaymentMethodLabel} /> : <IconTrash aria-hidden="true" size={16} />}
                                    </Button>
                                }
                            />
                        ))
                    ) : (
                        <LicenseTabRow description={content.editor.noPaymentMethodsLabel} />
                    )}
                </LicenseTabSection>
            </TabContent>
        </LicenseDialog>
    )
}
