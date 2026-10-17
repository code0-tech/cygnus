"use client"

import { useLicenseToasts } from "@/components/licenses/layout/LicenseNotifications"
import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/shared/LicenseDialog"
import { CustomerPaymentMethodCard, CustomerPaymentMethodCardSkeleton } from "@/components/licenses/dialog/customer/CustomerPaymentMethodCard"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSaveButton, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/customer/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import { useCustomerPaymentMethods } from "@/hooks/usePaymentMethods"
import type { CheckoutData, ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { type CustomerEditSection, getCustomerEditSectionLabels } from "@/lib/licenses/editSections"
import { removeLicenseCustomerPaymentMethod, updateLicenseCustomer } from "@/lib/licenses/client"
import { createLicenseCustomerPath, resolveCustomerRouteId } from "@/lib/licenses/routes"
import { Button, EmailInput, Spacing, Text, TextInput, useForm } from "@code0-tech/pictor"
import { IconCreditCard, IconMail, IconPhone, IconTrash, IconUser } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, type ReactNode, useMemo, useState } from "react"

interface CustomerEditDialogProps {
    checkoutForm: CheckoutData["form"]
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    locale: AppLocale
}

interface CustomerFormValues {
    name: string
    email: string
    phone: string
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    country: string
}

interface CustomerField {
    autoComplete: string
    className?: string
    description: string
    maxLength?: number
    name: keyof CustomerFormValues
    pattern?: string
    title: string
    type?: "email"
    left?: ReactNode
    leftType?: "icon"
}

export function CustomerEditDialog({ checkoutForm, content, customerId, errors, locale }: CustomerEditDialogProps) {
    const toasts = useLicenseToasts()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { customers, updateCustomer } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const requestedTab = searchParams.get("tab")
    const section: CustomerEditSection = requestedTab === "paymentMethods" || (requestedTab !== "general" && searchParams.has("setup_intent")) ? "paymentMethods" : "general"
    const sectionLabels = getCustomerEditSectionLabels(content.editor)
    const { isLoadingPaymentMethods, paymentMethods, paymentMethodsError, refreshPaymentMethods, removePaymentMethodLocally } = useCustomerPaymentMethods(customer?.id, section === "paymentMethods")
    const [removingPaymentMethodId, setRemovingPaymentMethodId] = useState<string | null>(null)
    const [removePaymentMethodError, setRemovePaymentMethodError] = useState<string | null>(null)
    const close = () => router.replace(createLicenseCustomerPath(locale, resolvedCustomerId))

    const initialValues = useMemo<CustomerFormValues>(() => ({
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        line1: customer?.address?.line1 ?? "",
        line2: customer?.address?.line2 ?? "",
        city: customer?.address?.city ?? "",
        state: customer?.address?.state ?? "",
        postalCode: customer?.address?.postalCode ?? "",
        country: customer?.address?.country ?? "",
    }), [customer])
    const validation = useMemo(() => {
        const required = (value: string) => value.trim() ? null : locale === "de" ? "Bitte fülle dieses Feld aus." : "Please fill out this field."
        return {
            name: required,
            email: (value: string) => required(value) ?? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : locale === "de" ? "Bitte gib eine gültige E-Mail-Adresse ein." : "Please enter a valid email address."),
            line1: required,
            city: required,
            postalCode: required,
            country: (value: string) => required(value) ?? (/^[A-Za-z]{2}$/.test(value.trim()) ? null : locale === "de" ? "Bitte gib einen zweistelligen Ländercode ein." : "Please enter a two-letter country code."),
        }
    }, [locale])
    const [inputs, validate, values] = useForm<CustomerFormValues>({
        initialValues,
        validate: validation,
        useInitialValidation: false,
        onSubmit: (submittedValues) => { void save(submittedValues) },
    })

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
            const errorCode = await removeLicenseCustomerPaymentMethod(customer.id, paymentMethodId)
            if (errorCode) throw new Error(errorCode === "PAYMENT_METHOD_IN_USE" ? errors.paymentMethodInUse : errors.paymentMethodRemove)

            removePaymentMethodLocally(paymentMethodId)
            toasts.success("paymentRemoved")
        } catch (removeError) {
            setRemovePaymentMethodError(removeError instanceof Error ? removeError.message : errors.paymentMethodRemove)
            toasts.error(removeError instanceof Error ? removeError.message : errors.paymentMethodRemove)
        } finally {
            setRemovingPaymentMethodId(null)
        }
    }

    const save = async ({ name, email, phone, line1, line2, city, state, postalCode, country }: CustomerFormValues) => {
        if (!customer || isSaving) return
        setIsSaving(true)
        setError(null)

        try {
            await updateLicenseCustomer(
                {
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
                },
                errors.customerUpdate
            )

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
            toasts.success("customerSaved")
            close()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : errors.customerUpdate)
            toasts.error(saveError instanceof Error ? saveError.message : errors.customerUpdate)
        } finally {
            setIsSaving(false)
        }
    }

    const fieldDescriptions = content.editor.fieldDescriptions
    const contactFields: CustomerField[] = [
        { autoComplete: "name", description: fieldDescriptions.name, name: "name", title: checkoutForm.nameLabel },
        {
            autoComplete: "email",
            description: fieldDescriptions.email,
            name: "email",
            title: checkoutForm.emailLabel,
            type: "email",
            left: <IconMail aria-hidden="true" size={16} />,
            leftType: "icon",
        },
        {
            autoComplete: "tel",
            description: fieldDescriptions.phone,
            name: "phone",
            title: checkoutForm.phoneLabel,
            left: <IconPhone aria-hidden="true" size={16} />,
            leftType: "icon",
        },
    ]
    const billingFields: CustomerField[] = [
        { autoComplete: "address-line1", description: fieldDescriptions.line1, name: "line1", title: checkoutForm.line1Label },
        { autoComplete: "address-line2", description: fieldDescriptions.line2, name: "line2", title: checkoutForm.line2Label },
        { autoComplete: "postal-code", description: fieldDescriptions.postalCode, name: "postalCode", title: checkoutForm.postalCodeLabel },
        { autoComplete: "address-level2", description: fieldDescriptions.city, name: "city", title: checkoutForm.cityLabel },
        { autoComplete: "address-level1", description: fieldDescriptions.state, name: "state", title: checkoutForm.stateLabel },
        {
            autoComplete: "country",
            className: "uppercase",
            description: fieldDescriptions.country,
            maxLength: 2,
            name: "country",
            pattern: "[A-Za-z]{2}",
            title: checkoutForm.countryLabel,
        },
    ]
    const renderFields = (fields: CustomerField[]) =>
        fields.map(({ type, ...field }, index) => {
            const Input = type === "email" ? EmailInput : TextInput
            const { formValidation, required } = inputs.getInputProps(field.name)

            return (
                <Fragment key={field.name}>
                    {index > 0 ? <Spacing spacing="md" /> : null}
                    <Input w="100%" {...field} formValidation={formValidation} required={required} value={values[field.name]} onBlur={() => validate(field.name, false)} />
                </Fragment>
            )
        })

    const sectionIcons = { general: IconUser, paymentMethods: IconCreditCard } satisfies Record<CustomerEditSection, typeof IconUser>
    const tabContent: Record<CustomerEditSection, ReactNode> = {
        general: (
            <>
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
        <form id="customer-details-form" noValidate onSubmit={(event) => { event.preventDefault(); validate() }}>
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
            </>
        ),
        paymentMethods: (
            <>
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
            </>
        ),
    }

    return (
        <LicenseDialog
            closeLabel={content.editor.closeLabel}
            description={section === "general" ? content.editor.customerDescription : content.editor.paymentMethodDescription}
            onClose={close}
            onValueChange={(value) => (value === "general" || value === "paymentMethods") && setSection(value)}
            tabs={(["general", "paymentMethods"] as const).map((value) => ({ value, label: sectionLabels[value], icon: sectionIcons[value], content: tabContent[value] }))}
            title={content.editor.customerTitle}
            value={section}
        />
    )
}
