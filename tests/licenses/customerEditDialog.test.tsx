import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React, { type ReactNode } from "react"
import { registerHooks } from "node:module"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import type { CheckoutData, ErrorsContent, LicenseContent } from "../../src/lib/cms"

installDomTestEnvironment()
// Pictor ships a partial bundled React directory; use the test renderer's React for its real hook.
const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier, specifier === "react" ? { ...context, parentURL: import.meta.url } : context)
    },
})
const { useForm } = await import("../../node_modules/@code0-tech/pictor/dist/components/form/useForm.js")
hooks.deregister()
const customer = { id: "customer-1", name: "Example", email: "hello@example.com", phone: "", address: { line1: "Main Street 1", line2: "", city: "Berlin", state: "", postalCode: "10115", country: "DE" } }
const update = mock.fn(async (_request: unknown) => {})
const removeMethod = mock.fn(async (_customerId: string, _methodId: string): Promise<string | undefined> => "PAYMENT_METHOD_IN_USE")
const errorToast = mock.fn((_message: string) => {})
let tab = "general"
const close = mock.fn()
const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>
const Input = ({ title, name, value, required, formValidation }: { title: string; name: string; value: string; required?: boolean; formValidation: { setValue: (value: string) => void; notValidMessage?: string } }) => <label>{title}<input aria-label={title} name={name} value={value} required={required} onChange={event => formValidation.setValue(event.target.value)} />{formValidation.notValidMessage && <span role="alert">{formValidation.notValidMessage}</span>}</label>
mock.module("@code0-tech/pictor", { namedExports: {
    useForm, TextInput: Input, EmailInput: Input, Text: Wrap, Spacing: () => null,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
} })
mock.module("next/navigation", { namedExports: { useRouter: () => ({ replace: close }), usePathname: () => "/edit", useSearchParams: () => new URLSearchParams({ tab }) } })
mock.module("@/lib/licenses/routes", { namedExports: { resolveCustomerRouteId: (id: string) => id, createLicenseCustomerPath: () => "/customer" } })
mock.module("@/lib/licenses/client", { namedExports: { updateLicenseCustomer: update, removeLicenseCustomerPaymentMethod: removeMethod } })
mock.module("@/components/licenses/data/LicenseDataProvider", { namedExports: { useLicenseData: () => ({ customers: [customer], updateCustomer: () => {} }) } })
mock.module("@/components/licenses/layout/LicenseNotifications", { namedExports: { useLicenseToasts: () => ({ success: () => {}, error: errorToast }) } })
mock.module("@/hooks/usePaymentMethods", { namedExports: { useCustomerPaymentMethods: () => ({ paymentMethods: [{ id: "pm_card" }], refreshPaymentMethods: () => {} }) } })
// Renders only the active tab, like the real dialog's TabContent.
const LicenseDialog = ({ tabs, value }: { tabs: { value: string; content: ReactNode }[]; value: string }) => <div>{tabs.find((tab) => tab.value === value)?.content}</div>
mock.module("@/components/licenses/dialog/shared/LicenseDialog", { namedExports: { LicenseDialog } })
mock.module("@/components/licenses/dialog/customer/CustomerPaymentMethodCard", { namedExports: { CustomerPaymentMethodCard: ({ action }: { action: ReactNode }) => <div>{action}</div>, CustomerPaymentMethodCardSkeleton: Wrap } })
mock.module("@/components/licenses/dialog/customer/PaymentMethodSetupDialog", { namedExports: { PaymentMethodSetupDialog: Wrap } })
mock.module("@/components/ui/Loader", { namedExports: { ButtonLoader: () => null } })
mock.module("@/components/licenses/dialog/shared/LicenseTabLayout", { namedExports: {
    LicenseTabAlert: Wrap, LicenseTabRow: Wrap, LicenseTabSection: Wrap,
    LicenseTabHeader: ({ action }: { action: ReactNode }) => <>{action}</>,
    LicenseTabSaveButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
} })
const { render, screen, fireEvent, cleanup, waitFor } = await import("@testing-library/react")
const { CustomerEditDialog } = await import("../../src/components/licenses/dialog/customer/CustomerEditDialog")
const labels = { nameLabel: "Name", emailLabel: "Email", phoneLabel: "Phone", line1Label: "Street", line2Label: "Address extra", cityLabel: "City", stateLabel: "State", postalCodeLabel: "Postal code", countryLabel: "Country" } as CheckoutData["form"]
const content = { editor: { fieldDescriptions: {}, saveLabel: "Save", removePaymentMethodLabel: "Remove card" } } as LicenseContent
const errors = { paymentMethodInUse: "This payment method is still in use." } as ErrorsContent
const show = () => render(<CustomerEditDialog checkoutForm={labels} content={content} customerId={customer.id} errors={errors} locale="en" />)
afterEach(() => { cleanup(); update.mock.resetCalls(); close.mock.resetCalls(); errorToast.mock.resetCalls(); removeMethod.mock.resetCalls(); tab = "general" })

test("a payment method in use is reported only through a toast", async () => {
    tab = "paymentMethods"
    show()
    fireEvent.click(screen.getByRole("button", { name: "Remove card" }))
    await waitFor(() => assert.equal(errorToast.mock.callCount(), 1))
    assert.deepEqual(errorToast.mock.calls[0].arguments, [errors.paymentMethodInUse])
    assert.equal(screen.queryByText(errors.paymentMethodInUse), null)
    assert.equal(screen.queryByRole("alert"), null)
    assert.equal(close.mock.callCount(), 0)
})

for (const label of ["Name", "Email", "Street", "City", "Postal code", "Country"]) {
    test(`blocks blank and whitespace-only ${label} without sending an update`, () => {
        show()
        for (const value of ["", "   "]) {
            fireEvent.change(screen.getByLabelText(label), { target: { value } })
            fireEvent.click(screen.getByText("Save"))
            assert.equal(update.mock.callCount(), 0)
            assert.equal(close.mock.callCount(), 0)
            assert.ok(screen.getAllByRole("alert").length > 0)
        }
    })
}

test("valid changes save trimmed values while optional address and phone fields can stay empty", async () => {
    show()
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Updated  " } })
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "de" } })
    fireEvent.click(screen.getByText("Save"))
    await waitFor(() => assert.equal(close.mock.callCount(), 1))
    assert.deepEqual(update.mock.calls[0].arguments[0], { ...customer, name: "Updated", phone: null, address: { ...customer.address, line2: null, state: null } })
})

test("invalid email and country are blocked and can be corrected before saving", async () => {
    show()
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } })
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "123" } })
    fireEvent.click(screen.getByText("Save"))
    assert.equal(update.mock.callCount(), 0)
    assert.equal(screen.getAllByRole("alert").length, 2)
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } })
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "DE" } })
    fireEvent.click(screen.getByText("Save"))
    await waitFor(() => assert.equal(close.mock.callCount(), 1))
})
