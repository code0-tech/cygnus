import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()
const DialogTestContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)
function TestDialog({ children, open = false, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
    return <DialogTestContext.Provider value={{ open, setOpen: onOpenChange ?? (() => {}) }}>{children}</DialogTestContext.Provider>
}
function TestDialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }> }) {
    const dialog = React.useContext(DialogTestContext)
    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        dialog?.setOpen(true)
    }
    return asChild ? (
        React.cloneElement(children, { onClick })
    ) : (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    )
}
function TestDialogPortal({ children }: { children: React.ReactNode }) {
    return React.useContext(DialogTestContext)?.open ? <>{children}</> : null
}
function TestDialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }> }) {
    const dialog = React.useContext(DialogTestContext)
    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        dialog?.setOpen(false)
    }
    return asChild ? (
        React.cloneElement(children, { onClick })
    ) : (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    )
}
const checkoutSearchParams = new URLSearchParams({
    customerType: "b2c",
    deploymentType: "self_hosted",
    paymentPeriod: "monthly",
    plan: "pro",
})
let guestEmail: string | null = null
let isSessionLoading = false
let checkoutProviderOptions: {
    clientSecret?: string
    defaultValues?: unknown
    elementsOptions?: { appearance?: { rules?: Record<string, Record<string, string>>; theme?: string; variables?: Record<string, string> } }
} | null = null
const stripeBillingAddress = {
    name: "Ada Lovelace",
    address: { city: "Berlin", country: "DE", line1: "Teststraße 1", line2: null, postal_code: "10115", state: "Berlin" },
}
let billingAddressOnChange: ((event: { complete: boolean; value: typeof stripeBillingAddress }) => void) | null = null
let billingAddressOnReady: (() => void) | null = null
let contactDetailsOnChange: ((event: { complete: boolean; value: { email: string } }) => void) | null = null
let contactDetailsOnReady: (() => void) | null = null
let billingAddressOptions: unknown = null
let standaloneAddressOptions: { defaultValues?: unknown } | null = null
let paymentElementOptions: unknown = null
let paymentElementOnReady: (() => void) | null = null
let paymentElementOnChange: ((event: { complete: boolean }) => void) | null = null
let taxIdElementOptions: unknown = null
type TaxIdChangeEvent = { complete: boolean; empty: boolean; value: { businessName: string; externalTaxIdType: string; taxId: string; taxIdType: string }; visible: boolean }
let taxIdElementOnChange: ((event: TaxIdChangeEvent) => void) | null = null
let stripeTaxIdInfoUpdates: unknown[] = []
let stripeLoadOptions: unknown = null
let checkoutStages: string[] = []
let checkoutStage = "billingAddress"
const checkoutStageListeners = new Set<() => void>()
let stripeConfirmCalls = 0
let stripeConfirmErrorMessage: string | null = null
let stripeCheckoutLoadErrorMessage: string | null = null
let stripeConfirmOptions: unknown[] = []
let stripeBillingAddressUpdates: unknown[] = []
let stripeBillingAddressUpdateGate: Promise<void> | null = null
let stripeEmailUpdates: unknown[] = []
let stripePromotionCodesApplied: string[] = []
let stripePromotionCodesRemoved = 0
let customerSelectOnValueChange: ((value: string) => void) | null = null
let checkoutPageReplacements: string[] = []
const setCheckoutStage = (stage: string) => {
    checkoutStage = stage
    checkoutStages.push(stage)
    checkoutStageListeners.forEach((listener) => listener())
}

mock.module("next/navigation", {
    namedExports: {
        usePathname: () => "/en/checkout",
        useRouter: () => ({ replace: () => {} }),
        useSearchParams: () => checkoutSearchParams,
        useParams: () => ({ locale: "en" }),
    },
})
mock.module("next/link", {
    defaultExport: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
})
mock.module("@/components/checkout/session/CraterSessionProvider", {
    namedExports: {
        useCraterSession: () => ({
            authenticated: true,
            guestEmail,
            error: null,
            isLoading: isSessionLoading,
        }),
    },
})
mock.module("@/components/checkout/state/CheckoutStageProvider", {
    namedExports: {
        useCheckoutStage: () => ({
            stage: React.useSyncExternalStore(
                (listener) => {
                    checkoutStageListeners.add(listener)
                    return () => checkoutStageListeners.delete(listener)
                },
                () => checkoutStage,
                () => checkoutStage
            ),
            setStage: setCheckoutStage,
            hasError: false,
            setHasError: () => {},
        }),
    },
})
const checkoutClient = await import("@/lib/checkout/client")
mock.module("@/lib/checkout/client", {
    namedExports: {
        ...checkoutClient,
        checkoutFetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
        replaceCheckoutPage: (url: string) => {
            checkoutPageReplacements.push(url)
            window.history.replaceState(window.history.state, "", url)
        },
    },
})
mock.module("@/components/checkout/shared/SendOfferDialog", {
    namedExports: {
        SendOfferDialog: ({ content }: { content: CheckoutData["form"] }) => <button type="button">{content.sendOfferLabel}</button>,
    },
})
mock.module("@/components/checkout/summary/CheckoutPricingOverview", { namedExports: { CheckoutPricingOverview: () => null } })
mock.module("@code0-tech/pictor", {
    namedExports: {
        Alert: ({ children, color, ...props }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => <div role={color === "error" ? "alert" : "status"} aria-live={color === "error" ? "assertive" : "polite"} {...props}>{children}</div>,
        AutoScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollAreaViewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        ScrollAreaScrollbar: () => null,
        ScrollAreaThumb: () => null,
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        SegmentedControl: () => null,
        SegmentedControlItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Dialog: TestDialog,
        DialogClose: TestDialogClose,
        DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div role="dialog" {...props}>
                {children}
            </div>
        ),
        DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
        DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        DialogOverlay: () => null,
        DialogPortal: TestDialogPortal,
        DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
        DialogTrigger: TestDialogTrigger,
        EmailInput: TestInput,
        TextInput: TestInput,
        CheckboxInput: TestCheckbox,
        InputMessage: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        SelectInput: ({ children, onValueChange, title }: { children: React.ReactNode; onValueChange?: (value: string) => void; title?: React.ReactNode }) => {
            customerSelectOnValueChange = onValueChange ?? null
            return (
                <div>
                    <span>{title}</span>
                    {children}
                </div>
            )
        },
        SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        SelectValue: () => null,
        SelectPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        SelectViewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        SelectItemText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        emailValidation: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        useForm: useTestForm,
    },
})
mock.module("@stripe/stripe-js/pure", {
    namedExports: {
        loadStripe: (_publishableKey: string, options: unknown) => {
            stripeLoadOptions = options
            return Promise.resolve({})
        },
    },
})
mock.module("@stripe/react-stripe-js", {
    namedExports: {
        Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        AddressElement: ({ onChange, options }: { onChange: (event: { complete: boolean; value: typeof stripeBillingAddress }) => void; options?: { defaultValues?: unknown } }) => {
            billingAddressOnChange = onChange
            standaloneAddressOptions = options ?? null
            return <div data-testid="standalone-address">Billing address</div>
        },
    },
})
mock.module("@stripe/react-stripe-js/checkout", {
    namedExports: {
        BillingAddressElement: ({ onChange, onReady, options }: { onChange: (event: { complete: boolean; value: typeof stripeBillingAddress }) => void; onReady?: () => void; options?: unknown }) => {
            billingAddressOnChange = onChange
            billingAddressOnReady = onReady ?? null
            billingAddressOptions = options
            return <div data-testid="stripe-billing-address">Billing address</div>
        },
        CheckoutElementsProvider: ({
            children,
            options,
        }: {
            children: React.ReactNode
            options: {
                clientSecret: string
                defaultValues?: unknown
                elementsOptions?: { appearance?: { rules?: Record<string, Record<string, string>>; theme?: string; variables?: Record<string, string> } }
            }
        }) => {
            checkoutProviderOptions = options
            return <>{children}</>
        },
        ContactDetailsElement: ({ onChange, onReady }: { onChange: (event: { complete: boolean; value: { email: string } }) => void; onReady?: () => void }) => {
            contactDetailsOnChange = onChange
            contactDetailsOnReady = onReady ?? null
            return <div data-testid="stripe-contact-details">Contact details</div>
        },
        PaymentElement: ({ onChange, onReady, options }: { onChange?: (event: { complete: boolean }) => void; onReady?: () => void; options?: unknown }) => {
            paymentElementOptions = options
            paymentElementOnReady = onReady ?? null
            paymentElementOnChange = onChange ?? null
            return <div data-testid="stripe-payment">Payment details</div>
        },
        TaxIdElement: ({ onChange, options }: { onChange?: (event: TaxIdChangeEvent) => void; options: unknown }) => {
            taxIdElementOptions = options
            taxIdElementOnChange = onChange ?? null
            return <div data-testid="stripe-tax-id">Tax ID</div>
        },
        useCheckoutElements: () =>
            stripeCheckoutLoadErrorMessage
                ? { type: "error", error: { message: stripeCheckoutLoadErrorMessage } }
                : {
                      type: "success",
                      checkout: {
                          applyPromotionCode: async (code: string) => {
                              stripePromotionCodesApplied.push(code)
                              return { type: "success", session: { tax: { status: "requires_location_inputs" } } }
                          },
                          email: null,
                          confirm: async (options: unknown) => {
                              stripeConfirmCalls += 1
                              stripeConfirmOptions.push(options)
                              if (stripeConfirmErrorMessage) return { type: "error", error: { message: stripeConfirmErrorMessage } }
                              return { type: "success", session: {} }
                          },
                          updateBillingAddress: async (address: unknown) => {
                              stripeBillingAddressUpdates.push(address)
                              await stripeBillingAddressUpdateGate
                              return { type: "success", session: {} }
                          },
                          updateTaxIdInfo: async (taxIdInfo: unknown) => {
                              stripeTaxIdInfoUpdates.push(taxIdInfo)
                              return { type: "success", session: { taxIdInfo } }
                          },
                          updateEmail: async (email: unknown) => {
                              stripeEmailUpdates.push(email)
                              return { type: "success", session: {} }
                          },
                          removePromotionCode: async () => {
                              stripePromotionCodesRemoved += 1
                              return { type: "success", session: { tax: { status: "requires_location_inputs" } } }
                          },
                      },
                  },
    },
})

const { act, cleanup, render: renderComponent, screen, waitFor } = await import("@testing-library/react")
const { StripeProvider } = await import("../../src/components/providers/StripeProvider")
function render(ui: React.ReactNode) {
    return renderComponent(ui, { wrapper: ({ children }) => <StripeProvider publicKey="pk_test_example">{children}</StripeProvider> })
}
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutDiscount } = await import("../../src/components/checkout/summary/CheckoutSummary")
const { CheckoutForm } = await import("../../src/components/checkout/form/CheckoutForm")
const { getStripePricingFromSession } = await import("../../src/lib/checkout/stripeCheckout")
const { CheckoutFormProvider, useCheckoutFormState } = await import("../../src/components/checkout/form/CheckoutFormProvider")
const { clearCheckoutContactDraft, readCheckoutContactDraft, saveCheckoutContactDraft } = await import("../../src/lib/checkout/checkoutDraft")

class CheckoutErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    render() {
        return this.state.failed ? <div data-testid="checkout-error-page">Error page</div> : this.props.children
    }
}

const originalFetch = globalThis.fetch
afterEach(() => {
    cleanup()
    guestEmail = null
    isSessionLoading = false
    checkoutSearchParams.delete("guestCheckout")
    clearCheckoutContactDraft()
    globalThis.fetch = originalFetch
    checkoutSearchParams.set("customerType", "b2c")
    checkoutSearchParams.set("plan", "pro")
    checkoutSearchParams.set("deploymentType", "self_hosted")
    checkoutSearchParams.set("paymentPeriod", "monthly")
    checkoutSearchParams.delete("promotionCode")
    checkoutProviderOptions = null
    billingAddressOnChange = null
    contactDetailsOnChange = null
    billingAddressOptions = null
    standaloneAddressOptions = null
    paymentElementOptions = null
    paymentElementOnReady = null
    paymentElementOnChange = null
    taxIdElementOptions = null
    taxIdElementOnChange = null
    stripeTaxIdInfoUpdates = []
    checkoutStages = []
    checkoutStage = "billingAddress"
    stripeConfirmCalls = 0
    stripeConfirmErrorMessage = null
    stripeCheckoutLoadErrorMessage = null
    window.sessionStorage.removeItem("code0.checkout.sessionLoadRecovery")
    stripeConfirmOptions = []
    stripeBillingAddressUpdates = []
    stripeBillingAddressUpdateGate = null
    stripeEmailUpdates = []
    stripePromotionCodesApplied = []
    stripePromotionCodesRemoved = 0
    customerSelectOnValueChange = null
    checkoutPageReplacements = []
    window.history.replaceState(null, "", "/en/checkout")
})

const errors = {
    retry: "Try again",
    sessionUnavailable: "Session unavailable",
    customerCreation: "Customer creation failed",
    customerTypeMismatch: "Customer type mismatch",
    checkoutCustomer: "Invalid checkout customer",
    checkoutSession: "Checkout session failed",
    checkoutRateLimit: "CMS: Please wait before trying again",
    checkoutSessionExpired: "Checkout session expired",
    billingAddressUpdate: "Billing address update failed",
    emailUpdate: "Email update failed",
    paymentConfirmation: "Payment confirmation failed",
    discountSessionRequired: "Discount session required",
    discountValidation: "Discount validation failed",
    paymentFallback: "Checkout failed",
} as ErrorsContent

const content = {
    billingHeading: "Billing information",
    continueLabel: "Continue to payment",
    backToBillingLabel: "Back",
    payNowLabel: "Pay now",
    withdrawalConsentText: "I expressly request that Code0 begins providing the service before the withdrawal period ends.",
    sendOfferPrompt: "Need an invoice or a quote first?",
    sendOfferLabel: "Send offer",
    sendOfferTitle: "Send offer",
    sendOfferDescription: "Enter the recipient email address.",
    processingLabel: "Processing",
    customerSelectLabel: "Billing customer",
    newCustomerLabel: "Create new customer",
    nameLabel: "Name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone",
    line1Label: "Address",
    line2Label: "Address line 2",
    cityLabel: "City",
    stateLabel: "State",
    postalCodeLabel: "Postal code",
    countryLabel: "Country",
} as CheckoutData["form"]

function TestInput({
    formValidation,
    title,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    formValidation?: { error?: string | null }
    title?: string
}) {
    return (
        <label>
            <span>{title}</span>
            <input aria-label={title} {...props} />
            {formValidation?.error && <span>{formValidation.error}</span>}
        </label>
    )
}

test("maps Stripe's exact discount, tax, and total from minor currency units", () => {
    const pricing = getStripePricingFromSession({
        billingAddress: { address: { country: "DE" } },
        currency: "eur",
        minorUnitsAmountDivisor: 100,
        tax: { status: "ready" },
        taxAmounts: [
            { amount: "€17.10", minorUnitsAmount: 1_710, inclusive: false, displayName: "VAT", percentage: 19 },
            { amount: "€0.00", minorUnitsAmount: 0, inclusive: false, displayName: "Zero tax", percentage: 0 },
        ],
        total: {
            discount: { amount: "€10.00", minorUnitsAmount: 1_000 },
            subtotal: { amount: "€100.00", minorUnitsAmount: 10_000 },
            taxExclusive: { amount: "€17.10", minorUnitsAmount: 1_710 },
            taxInclusive: { amount: "€0.00", minorUnitsAmount: 0 },
            total: { amount: "€107.10", minorUnitsAmount: 10_710 },
        },
    } as never)

    assert.deepEqual(pricing, {
        billingCountry: "DE",
        currency: "eur",
        discountAmount: 10,
        subtotalPrice: 100,
        taxAmount: 17.1,
        taxAmountInclusive: 0,
        taxLines: [{ amount: 17.1, displayName: "VAT", inclusive: false, percentage: 19 }],
        totalPrice: 107.1,
    })
})

test("maps missing Stripe tax details to empty tax lines and no billing country", () => {
    const pricing = getStripePricingFromSession({
        billingAddress: null,
        currency: "eur",
        minorUnitsAmountDivisor: 100,
        tax: { status: "ready" },
        taxAmounts: null,
        total: {
            discount: { minorUnitsAmount: 0 },
            subtotal: { minorUnitsAmount: 10_000 },
            taxExclusive: { minorUnitsAmount: 0 },
            taxInclusive: { minorUnitsAmount: 0 },
            total: { minorUnitsAmount: 10_000 },
        },
    } as never)

    assert.equal(pricing?.billingCountry, null)
    assert.deepEqual(pricing?.taxLines, [])
})

test("keeps included and additional tax separate without adding included tax to the total", () => {
    for (const [inclusive, exclusive, total] of [[1_900, 0, 11_900], [1_900, 1_000, 12_900], [0, 0, 10_000]]) {
        const pricing = getStripePricingFromSession({
            currency: "eur",
            minorUnitsAmountDivisor: 100,
            tax: { status: "ready" },
            total: {
                discount: { minorUnitsAmount: 0 },
                subtotal: { minorUnitsAmount: 11_900 },
                taxExclusive: { minorUnitsAmount: exclusive },
                taxInclusive: { minorUnitsAmount: inclusive },
                total: { minorUnitsAmount: total },
            },
        } as never)

        assert.equal(pricing?.taxAmountInclusive, inclusive / 100)
        assert.equal(pricing?.taxAmount, exclusive / 100)
        assert.equal(pricing?.totalPrice, total / 100)
    }
})

test("does not treat Stripe totals as final while tax is still pending", () => {
    assert.equal(
        getStripePricingFromSession({
            currency: "eur",
            minorUnitsAmountDivisor: 100,
            tax: { status: "requires_location_inputs" },
            total: {},
        } as never),
        null
    )
})

function TestCheckbox({ formValidation }: { formValidation?: { setValue?: (value: boolean) => void } }) {
    return <input type="checkbox" onChange={(event) => formValidation?.setValue?.(event.target.checked)} />
}

function useTestForm<T extends Record<string, unknown>>({
    initialValues,
    onSubmit,
    validate: validators,
}: {
    initialValues: T
    onSubmit: (values: T) => void
    useInitialValidation: boolean
    validate: { [Key in keyof T]: (value: T[Key]) => string | null }
}) {
    const [values, setValues] = React.useState(initialValues)
    const [errors, setErrors] = React.useState<Partial<Record<keyof T, string | null>>>({})

    const validate = (field?: keyof T) => {
        const fields = field ? [field] : (Object.keys(validators) as Array<keyof T>)
        const nextErrors = { ...errors }

        for (const currentField of fields) {
            nextErrors[currentField] = validators[currentField](values[currentField])
        }

        setErrors(nextErrors)
        if (!field && Object.values(nextErrors).every((error) => !error)) onSubmit(values)
    }

    return [
        {
            getInputProps: (name: keyof T) => ({
                value: values[name],
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    const value = event.currentTarget.value
                    setValues((currentValues) => ({
                        ...currentValues,
                        [name]: value,
                    }))
                },
                formValidation: {
                    error: errors[name],
                    notValidMessage: errors[name],
                    setValue: (value: T[keyof T]) => {
                        setValues((currentValues) => ({
                            ...currentValues,
                            [name]: value,
                        }))
                    },
                    valid: !errors[name],
                },
            }),
        },
        validate,
        values,
    ] as const
}

test("creates a customer with contact details only when continuing to payment", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ init, url: String(input) })
        const body =
            String(input) === "/api/crater/customer"
                ? init?.method === "POST"
                    ? { customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }
                    : { customers: [] }
                : { clientSecret: "cs_test_secret", expiresAt: 1_800_000_000, id: "cs_test" }
        return new Response(JSON.stringify(body), { status: 200 })
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByTestId("standalone-address")
    assert.equal(requests.length, 1)
    assert.equal(checkoutProviderOptions, null)
    assert.equal((screen.getByRole("button", { name: content.continueLabel }) as HTMLButtonElement).disabled, true)
    await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
    assert.equal(requests.length, 1)
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    await user.click(screen.getByRole("button", { name: content.continueLabel }))
    await screen.findByTestId("stripe-payment")
    assert.deepEqual(
        requests.map(({ url }) => url),
        ["/api/crater/customer", "/api/crater/customer", "/api/crater/checkout/session"]
    )
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
        customerType: "personal",
        name: stripeBillingAddress.name,
        email: "ada@example.com",
        address: { city: "Berlin", country: "DE", line1: stripeBillingAddress.address.line1, line2: null, postalCode: "10115", state: "Berlin" },
    })
    assert.equal(JSON.parse(String(requests[2].init?.body)).customerId, "gid://crater/Customer/1")
    assert.deepEqual(stripeEmailUpdates, [])
    assert.equal(checkoutStage, "payment")
    await waitFor(() => assert.deepEqual(stripeBillingAddressUpdates, [stripeBillingAddress]))
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, true)
    act(() => paymentElementOnReady?.())
    act(() => paymentElementOnChange?.({ complete: true }))
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, true)
    const withdrawalConsent = screen.getByRole("checkbox", { name: content.withdrawalConsentText })
    assert.equal(withdrawalConsent.getAttribute("aria-checked"), "false")
    await user.click(screen.getByRole("checkbox", { name: /Terms and Conditions/ }))
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, true)
    await user.click(withdrawalConsent)
    assert.equal(withdrawalConsent.getAttribute("aria-checked"), "true")
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, false)
    await user.click(screen.getByRole("button", { name: content.backToBillingLabel }))
    act(() => billingAddressOnReady?.())
    await screen.findByText(content.customerSelectLabel)
    assert.equal((screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement).value, "ada@example.com")
    assert.ok(screen.getByText("Ada Lovelace"))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer" && request.init?.method === "POST").length, 1)
    await user.click(screen.getByRole("button", { name: content.continueLabel }))
    await screen.findByRole("button", { name: content.payNowLabel })
    act(() => paymentElementOnReady?.())
    act(() => paymentElementOnChange?.({ complete: true }))
    stripeConfirmErrorMessage = "Your payment could not be confirmed."
    await user.click(screen.getByRole("button", { name: content.payNowLabel }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 1))
    assert.ok(screen.getByText(errors.paymentConfirmation))
    stripeConfirmErrorMessage = null
    await user.click(screen.getByRole("button", { name: content.payNowLabel }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 2))
    assert.deepEqual(stripeConfirmOptions, [{ redirect: "always" }, { redirect: "always" }])
})

test("recreates the checkout session for a selected or newly created customer", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    let sessionCount = 0
    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        requests.push({ init, url })

        if (url === "/api/crater/customer" && init?.method !== "POST") {
            return new Response(
                JSON.stringify({
                    customers: [
                        { customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" },
                        { customerType: "personal", email: "grace@example.com", id: "gid://crater/Customer/2", name: "Grace" },
                    ],
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        }

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customerType: "personal", email: null, id: "gid://crater/Customer/3", name: null }), {
                status: 201,
                headers: { "content-type": "application/json" },
            })
        }

        sessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_customer_${sessionCount}`, expiresAt: 1_800_000_000, id: `cs_customer_${sessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    // Until Crater has answered it is unknown whether there are customers, so the placeholder reserves no select yet.
    assert.ok(screen.getByTestId("checkout-form-skeleton"))
    assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null)
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_customer_1"))
    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })
    await waitFor(() => assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null))
    assert.ok(screen.getByText(content.customerSelectLabel))
    assert.equal(screen.getAllByText(content.newCustomerLabel).length, 1)

    act(() => customerSelectOnValueChange?.("gid://crater/Customer/2"))
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_customer_2"))
    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })
    await waitFor(() => assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null))

    act(() => customerSelectOnValueChange?.("new"))
    await screen.findByTestId("standalone-address")
    assert.equal(sessionCount, 2)
    assert.equal(requests.filter((request) => request.init?.method === "POST" && request.url === "/api/crater/customer").length, 0)
    const user = userEvent.setup()
    await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    await user.click(screen.getByRole("button", { name: content.continueLabel }))
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_customer_3"))
    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })
    await waitFor(() => assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null))

    const sessionBodies = requests.filter((request) => request.url === "/api/crater/checkout/session").map((request) => JSON.parse(String(request.init?.body)) as { customerId: string })
    assert.deepEqual(
        sessionBodies.map((body) => body.customerId),
        ["gid://crater/Customer/1", "gid://crater/Customer/2", "gid://crater/Customer/3"]
    )
    const customerCreationRequests = requests.filter((request) => request.url === "/api/crater/customer" && request.init?.method === "POST")
    assert.equal(customerCreationRequests.length, 1)
    assert.equal(JSON.parse(String(customerCreationRequests[0].init?.body)).name, stripeBillingAddress.name)
})

test("replaces a checkout session shortly before it expires", async () => {
    const requests: string[] = []
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input) => {
        const url = String(input)
        requests.push(url)

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        checkoutSessionCount += 1
        return new Response(
            JSON.stringify({
                clientSecret: `cs_expiry_${checkoutSessionCount}`,
                expiresAt: checkoutSessionCount === 1 ? Math.floor(Date.now() / 1_000) : 1_800_000_000,
                id: `cs_expiry_${checkoutSessionCount}`,
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((url) => url === "/api/crater/checkout/session").length, 2))
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_expiry_2"))
    assert.equal(requests.filter((url) => url === "/api/crater/customer").length, 1)
})

test("renews an expired checkout after the returning tab has revalidated its Crater session", async () => {
    const originalNow = Date.now
    let now = originalNow()
    Date.now = () => now
    let sessionRequests = 0
    globalThis.fetch = (async (input) => String(input) === "/api/crater/customer"
        ? Response.json({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }] })
        : Response.json({ clientSecret: `cs_resume_${++sessionRequests}`, expiresAt: Math.floor(now / 1_000) + 120, id: `cs_resume_${sessionRequests}` })
    ) as typeof fetch
    try {
        const view = render(<CheckoutForm content={content} errors={errors} locale="en" />)
        await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_resume_1"))
        act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
        const draftBeforeReturn = readCheckoutContactDraft(checkoutSearchParams)

        // A hidden tab may miss its timer; no replacement should start before authentication is checked.
        now += 180_000
        isSessionLoading = true
        view.rerender(<CheckoutForm content={content} errors={errors} locale="en" />)
        assert.equal(sessionRequests, 1)
        isSessionLoading = false
        view.rerender(<CheckoutForm content={content} errors={errors} locale="en" />)
        await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_resume_2"))
        assert.equal(sessionRequests, 2)
        assert.deepEqual(readCheckoutContactDraft(checkoutSearchParams)?.billingAddress, draftBeforeReturn?.billingAddress)
        assert.equal(screen.queryByRole("alert"), null)
    } finally {
        Date.now = originalNow
    }
})

test("replaces an inactive Stripe checkout session only once", async () => {
    stripeCheckoutLoadErrorMessage = "The Checkout Session is no longer active."
    const requests: string[] = []
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input) => {
        const url = String(input)
        requests.push(url)

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        checkoutSessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_inactive_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_inactive_${checkoutSessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((url) => url === "/api/crater/checkout/session").length, 2))
    await new Promise((resolve) => setTimeout(resolve, 25))
    assert.equal(requests.filter((url) => url === "/api/crater/checkout/session").length, 2)
    assert.equal(requests.filter((url) => url === "/api/crater/customer").length, 1)
})

test("recovers once when a newly created Stripe checkout session cannot be loaded", async () => {
    stripeCheckoutLoadErrorMessage = "The Checkout Session could not be loaded."
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input) => {
        const url = String(input)

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        checkoutSessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_recover_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_recover_${checkoutSessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.ok(window.sessionStorage.getItem("code0.checkout.sessionLoadRecovery")))
    assert.equal(checkoutSessionCount, 1)
    assert.deepEqual(checkoutPageReplacements, [window.location.href])
    assert.equal(screen.queryByText(errors.checkoutSession), null)
    assert.ok(screen.getByTestId("checkout-form-skeleton"))
})

test("shows only the configured error when Stripe cannot load the checkout session", async () => {
    stripeCheckoutLoadErrorMessage = "The Checkout Session could not be loaded."
    window.sessionStorage.setItem("code0.checkout.sessionLoadRecovery", JSON.stringify({ recoveryId: checkoutSearchParams.toString(), expiresAt: Date.now() + 60_000 }))
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input) => {
        const url = String(input)
        if (url === "/api/crater/checkout/session") checkoutSessionCount += 1
        return new Response(
            JSON.stringify(
                url === "/api/crater/customer"
                    ? { customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }
                    : { clientSecret: `cs_load_error_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_load_error_${checkoutSessionCount}` }
            ),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    assert.ok(await screen.findByText(`${errors.checkoutSession} (${stripeCheckoutLoadErrorMessage})`))
    assert.equal(checkoutSessionCount, 1)
    assert.equal(screen.queryByText(content.customerSelectLabel), null)
    assert.equal(screen.queryByTestId("stripe-contact-details"), null)
    assert.equal(screen.queryByTestId("stripe-billing-address"), null)
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.ok(screen.getByRole("button", { name: errors.retry }))
})

for (const [errorCode, expectedMessage] of [
    ["INVALID_CHECKOUT_SESSION", errors.checkoutSession],
    ["UNKNOWN_FUTURE_CODE", errors.checkoutSession],
    ["INVALID_CHECKOUT_CUSTOMER", errors.checkoutCustomer],
]) {
    test(`maps ${errorCode} to CMS copy without displaying backend diagnostics`, async () => {
        globalThis.fetch = (async (input) => Response.json(String(input) === "/api/crater/customer"
            ? { customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }
            : { error: "Internal backend message", errorCode, details: ["stripe_price_id: missing"] },
            { status: String(input) === "/api/crater/customer" ? 200 : 422 }
        )) as typeof fetch

        render(<CheckoutForm content={content} errors={errors} locale="en" />)
        assert.ok(await screen.findByText(expectedMessage))
        assert.equal(screen.queryByText(/Internal backend message|stripe_price_id|UNKNOWN_FUTURE_CODE|INVALID_CHECKOUT_SESSION/), null)
    })
}

for (const [field, value] of [["plan", "invalid"], ["customerType", "invalid"], ["deploymentType", "invalid"], ["paymentPeriod", "weekly"]]) {
    test(`opens the error page for invalid URL ${field} before loading customers or creating a session`, async () => {
        checkoutSearchParams.set(field, value)
        const requests = mock.fn(async () => Response.json({ customers: [] }))
        globalThis.fetch = requests as typeof fetch
        render(<CheckoutErrorBoundary><CheckoutForm content={content} errors={errors} locale="en" /></CheckoutErrorBoundary>)
        assert.ok(screen.getByTestId("checkout-error-page"))
        assert.equal(screen.queryByRole("alert"), null)
        assert.equal(requests.mock.callCount(), 0)
    })
}

for (const [status, errorCode] of [[400, null], [422, "INVALID_CHECKOUT_SELECTION"], [422, "CUSTOMER_TYPE_MISMATCH"]] as const) {
    test(`opens the error page for invalid checkout parameters (${status}, ${errorCode})`, async () => {
        globalThis.fetch = (async (input) => String(input) === "/api/crater/customer"
            ? Response.json({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }] })
            : Response.json({ error: "Internal backend message", errorCode, details: ["stripe_price_id: missing"] }, { status })
        ) as typeof fetch

        render(<CheckoutErrorBoundary><CheckoutForm content={content} errors={errors} locale="en" /></CheckoutErrorBoundary>)
        await screen.findByTestId("checkout-error-page")
        assert.equal(screen.queryByRole("alert"), null)
        assert.equal(screen.queryByRole("button", { name: errors.retry }), null)
        assert.equal(screen.queryByText(/Internal backend message|stripe_price_id/), null)
    })
}

for (const trigger of ["new customer", "customer selection", "session refresh"] as const) {
    test(`opens the error page for invalid checkout parameters during ${trigger}`, async () => {
        let sessionRequests = 0
        globalThis.fetch = (async (input, init) => {
            if (String(input) === "/api/crater/customer") {
                const customer = { customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }
                return Response.json(init?.method === "POST" ? customer : { customers: trigger === "new customer" ? [] : [customer, { ...customer, id: "gid://crater/Customer/2" }] })
            }
            sessionRequests += 1
            return trigger !== "new customer" && sessionRequests === 1
                ? Response.json({ clientSecret: "cs_initial_secret", expiresAt: 1_800_000_000, id: "cs_initial" })
                : Response.json({ error: "Invalid selection", errorCode: "INVALID_CHECKOUT_SELECTION" }, { status: 422 })
        }) as typeof fetch

        function RefreshTrigger() {
            const { refreshExpiredCheckoutSession } = useCheckoutFormState()
            return <button onClick={() => void refreshExpiredCheckoutSession()}>Refresh session</button>
        }

        render(
            <CheckoutErrorBoundary>
                <CheckoutFormProvider content={content} errors={errors} locale="en">
                    <CheckoutForm />
                    <RefreshTrigger />
                </CheckoutFormProvider>
            </CheckoutErrorBoundary>
        )
        const user = userEvent.setup()
        if (trigger === "new customer") {
            await screen.findByTestId("standalone-address")
            await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
            act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
            await user.click(screen.getByRole("button", { name: content.continueLabel }))
        } else {
            await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_initial_secret"))
            if (trigger === "customer selection") {
                act(() => { contactDetailsOnReady?.(); billingAddressOnReady?.() })
                await waitFor(() => assert.ok(customerSelectOnValueChange))
                act(() => customerSelectOnValueChange?.("gid://crater/Customer/2"))
            } else {
                await user.click(screen.getByRole("button", { name: "Refresh session" }))
            }
        }
        await screen.findByTestId("checkout-error-page")
        assert.equal(screen.queryByRole("alert"), null)
        assert.equal(sessionRequests, trigger === "new customer" ? 1 : 2)
    })
}

test("shows the checkout rate limit instead of disguising it as a session creation error", async () => {
    globalThis.fetch = (async (input) => {
        const url = String(input)
        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        return new Response(JSON.stringify({ error: "Too many requests. Please try again later.", errorCode: "RATE_LIMITED", details: ["Internal limiter details"] }), {
            status: 429,
            headers: { "content-type": "application/json", "Retry-After": "42" },
        })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    assert.ok(await screen.findByText(errors.checkoutRateLimit))
    assert.equal(screen.queryByText("Too many requests. Please try again later. (42s)"), null)
    assert.equal(screen.queryByText(errors.checkoutSession), null)
    assert.equal(screen.queryByText(/RATE_LIMITED|Internal limiter details/), null)
})

test("renders Stripe's Tax ID Element for a business customer", async () => {
    checkoutSearchParams.set("customerType", "b2b")
    const requests: Array<{ init?: RequestInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        requests.push({ init, url })
        return new Response(
            JSON.stringify(
                url === "/api/crater/customer"
                    ? { customers: [{ customerType: "business", email: "billing@example.com", id: "gid://crater/Customer/2", name: "Code0 GmbH" }] }
                    : { clientSecret: "cs_test_business_secret", expiresAt: 1_800_000_000, id: "cs_test_business" }
            ),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.length, 2))
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
        customerId: "gid://crater/Customer/2",
        customerType: "b2b",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    assert.equal(screen.queryByTestId("stripe-contact-details"), null)
    const storedEmailInput = screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement
    assert.equal(storedEmailInput.value, "billing@example.com")
    assert.equal(storedEmailInput.disabled, true)
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.ok(screen.getByTestId("stripe-tax-id"))
    assert.ok(screen.getByRole("button", { name: content.sendOfferLabel }))
    assert.deepEqual(taxIdElementOptions, { fields: { businessName: "always" }, visibility: "auto" })
    assert.deepEqual(stripeLoadOptions, { betas: ["custom_checkout_tax_id_1"], locale: "en" })
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    const taxIdValue = { businessName: "Code0 GmbH", externalTaxIdType: "eu_vat", taxId: "DE123456789", taxIdType: "de_vat" }
    act(() => taxIdElementOnChange?.({ complete: false, empty: false, value: { ...taxIdValue, taxId: "DE1" }, visible: true }))
    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, true)
    act(() => taxIdElementOnChange?.({ complete: true, empty: false, value: taxIdValue, visible: true }))
    const taxIdElement = screen.getByTestId("stripe-tax-id")
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    assert.ok(await screen.findByTestId("stripe-payment"))
    // The checkout SDK cannot prefill the Tax ID Element, so the billing step stays mounted and is only hidden.
    assert.ok(screen.getByTestId("stripe-tax-id") === taxIdElement, "the Tax ID Element was remounted")
    assert.ok(taxIdElement.closest("[hidden]"))
    assert.deepEqual(stripeEmailUpdates, [])
    assert.equal(screen.queryByRole("button", { name: content.sendOfferLabel }), null)
    assert.equal(screen.queryByRole("checkbox", { name: content.withdrawalConsentText }), null)
    act(() => paymentElementOnReady?.())
    act(() => paymentElementOnChange?.({ complete: true }))
    await user.click(screen.getByRole("checkbox", { name: /Terms and Conditions/ }))
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, false)
    assert.deepEqual(stripeTaxIdInfoUpdates, [{ businessName: "Code0 GmbH", taxId: { type: "eu_vat", value: "DE123456789" } }])
    await user.click(screen.getByRole("button", { name: content.backToBillingLabel }))
    await waitFor(() => assert.ok(!taxIdElement.closest("[hidden]"), "the billing step is still hidden"))
    assert.ok(screen.getByTestId("stripe-tax-id") === taxIdElement, "the Tax ID Element was remounted")
    assert.ok(screen.getByTestId("stripe-billing-address"))
})

test("does not write a draft customer email again after restoring the payment stage", async () => {
    checkoutSearchParams.set("promotionCode", "SAVE10")
    saveCheckoutContactDraft({
        billingAddress: stripeBillingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        emailSyncedToStripe: true,
        searchParams: checkoutSearchParams,
        stage: "payment",
    })

    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        if (url === "/api/crater/customer" && init?.method !== "POST") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }
        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: null }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }
        return new Response(JSON.stringify({ clientSecret: "cs_discount_restore", expiresAt: 1_800_000_000, id: "cs_discount_restore" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    let releaseBillingAddressUpdate = () => {}
    stripeBillingAddressUpdateGate = new Promise((resolve) => (releaseBillingAddressUpdate = resolve))

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    // Stripe can report the Payment Element ready before the restored billing address has been written back.
    await screen.findByTestId("stripe-payment")
    await waitFor(() => assert.deepEqual(stripeBillingAddressUpdates, [stripeBillingAddress]))
    act(() => paymentElementOnReady?.())
    act(() => paymentElementOnChange?.({ complete: true }))
    await act(async () => releaseBillingAddressUpdate())
    assert.deepEqual(stripeEmailUpdates, [])
    assert.deepEqual(checkoutProviderOptions?.defaultValues, { billingAddress: stripeBillingAddress })
    assert.ok(screen.getByTestId("stripe-payment"))

    const user = userEvent.setup()
    await user.click(screen.getByRole("checkbox", { name: /Terms and Conditions/ }))
    await user.click(screen.getByRole("checkbox", { name: content.withdrawalConsentText }))
    assert.equal((screen.getByRole("button", { name: content.payNowLabel }) as HTMLButtonElement).disabled, false)
})

test("shows only the configured error when loading customers fails", async () => {
    let requestCount = 0
    globalThis.fetch = (async () => {
        requestCount += 1
        return new Response(JSON.stringify({ error: "Crater rejected the customer." }), {
            status: 422,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    assert.ok(await screen.findByText(errors.customerCreation))
    assert.equal(screen.queryByText("Crater rejected the customer."), null)
    assert.equal(requestCount, 1)
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null)
    assert.equal(screen.queryByText(content.customerSelectLabel), null)
    const retryButton = screen.getByRole("button", { name: errors.retry })
    await userEvent.setup().click(retryButton)
    await waitFor(() => assert.equal(requestCount, 2))
})

test("applies a promotion code inside the active Stripe session without reloading checkout", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        requests.push({ init, url })

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        checkoutSessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_test_secret_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_test_${checkoutSessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    function PromotionCodeHarness() {
        const { checkoutSession, stripeCheckoutReady, stripeCheckoutRef, syncStripeCheckoutSession } = useCheckoutFormState()
        return (
            <div>
                {checkoutSession ? <span>{checkoutSession.clientSecret}</span> : <span>Replacing session</span>}
                <CheckoutDiscount
                    authenticated
                    buttonLabel="Apply SAVE10"
                    inputPlaceholder="Discount code"
                    promptLabel="Have a discount?"
                    removeLabel="Remove"
                    discountSessionRequiredError={errors.discountSessionRequired}
                    discountValidationError={errors.discountValidation}
                    checkoutRef={stripeCheckoutRef}
                    onSessionChange={syncStripeCheckoutSession}
                    sessionReady={stripeCheckoutReady}
                />
            </div>
        )
    }

    render(
        <CheckoutFormProvider content={content} errors={errors} locale="en">
            <CheckoutForm />
            <PromotionCodeHarness />
        </CheckoutFormProvider>
    )
    await waitFor(() => assert.equal(requests.length, 2))
    assert.ok(screen.getByText("cs_test_secret_1"))

    const user = userEvent.setup()
    await user.click(screen.getAllByRole("button", { name: "Have a discount?" }).at(-1)!)
    await user.type(screen.getByPlaceholderText("Discount code"), "SAVE10")
    await user.click(screen.getByRole("button", { name: "Apply SAVE10" }))

    await waitFor(() => assert.deepEqual(stripePromotionCodesApplied, ["SAVE10"]))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer").length, 1)
    assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 1)
    assert.deepEqual(checkoutPageReplacements, [])
    assert.ok(screen.getByText("cs_test_secret_1"))
})

test("retries a failed checkout session without creating a second customer", async () => {
    let creations = 0
    let sessions = 0
    const customer = { customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }
    globalThis.fetch = (async (input, init) => {
        if (String(input) === "/api/crater/customer") {
            if (init?.method === "POST") {
                creations += 1
                return new Response(JSON.stringify(customer), { status: 201 })
            }
            return new Response(JSON.stringify({ customers: creations ? [customer] : [] }))
        }
        sessions += 1
        return sessions === 1
            ? new Response(JSON.stringify({ error: "Session creation failed" }), { status: 502 })
            : new Response(JSON.stringify({ clientSecret: "cs_retry_secret", expiresAt: 1_800_000_000, id: "cs_retry" }))
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByTestId("standalone-address")
    await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    await user.click(screen.getByRole("button", { name: content.continueLabel }))
    await screen.findByRole("alert")
    assert.equal(creations, 1)
    assert.equal(readCheckoutContactDraft(checkoutSearchParams)?.customerId, customer.id)
    await user.click(screen.getByRole("button", { name: errors.retry }))
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_retry_secret"))
    assert.equal(creations, 1)
    assert.equal(sessions, 2)
})

test("does not replace a missing saved customer with a different billing customer", async () => {
    saveCheckoutContactDraft({ billingAddress: stripeBillingAddress, customerId: "gid://crater/Customer/99", email: "ada@example.com", searchParams: checkoutSearchParams, stage: "payment" })
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ customers: [{ customerType: "personal", email: "grace@example.com", name: "Grace", id: "gid://crater/Customer/2" }] }))
    }) as typeof fetch
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByText(errors.checkoutCustomer)
    assert.deepEqual(requests, ["/api/crater/customer"])
    assert.equal(checkoutProviderOptions, null)
    assert.equal(readCheckoutContactDraft(checkoutSearchParams), null)
})

test("does not save previous contact details under a changed checkout configuration", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ customers: [] }))) as typeof fetch
    const user = userEvent.setup()
    const { rerender } = render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByTestId("standalone-address")
    await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    assert.equal(readCheckoutContactDraft(checkoutSearchParams)?.email, "ada@example.com")
    checkoutSearchParams.set("plan", "max")
    rerender(<CheckoutForm content={content} errors={errors} locale="en" />)
    await waitFor(() => assert.equal((screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement).value, ""))
    const draft = readCheckoutContactDraft(checkoutSearchParams)
    assert.equal(draft?.email, null)
    assert.equal(draft?.billingAddress, null)
})

test("prefills and locks the guest email, ignoring a conflicting draft after reload", async () => {
    guestEmail = "guest@example.com"
    checkoutSearchParams.set("guestCheckout", "purchase-one")
    globalThis.fetch = (async () => new Response(JSON.stringify({ customers: [] }), { status: 200 })) as typeof fetch
    const first = render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByTestId("standalone-address")
    const input = screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement
    assert.equal(input.value, "guest@example.com")
    assert.equal(input.disabled, true)
    first.unmount()
    saveCheckoutContactDraft({ billingAddress: null, customerId: null, email: "other@example.com", searchParams: checkoutSearchParams, stage: "billingAddress" })
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await screen.findByTestId("standalone-address")
    const restoredInput = screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement
    assert.equal(restoredInput.value, "guest@example.com")
    assert.equal(restoredInput.disabled, true)
})

function respondWithCustomers(customers: Array<{ customerType: string; email: string | null; id: string; name: string | null }>, sessionGate?: Promise<void>) {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === "/api/crater/customer" && init?.method !== "POST") {
            return new Response(JSON.stringify({ customers }), { status: 200, headers: { "content-type": "application/json" } })
        }
        if (url === "/api/crater/customer") {
            await sessionGate
            return new Response(JSON.stringify({ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/9", name: "Ada" }), {
                status: 201,
                headers: { "content-type": "application/json" },
            })
        }
        await sessionGate
        return new Response(JSON.stringify({ clientSecret: "cs_layout", expiresAt: 1_800_000_000, id: "cs_layout" }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch
}

test("reserves the real customer select in the placeholder once existing customers are known", async () => {
    let releaseSession = () => {}
    respondWithCustomers([{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada" }], new Promise((resolve) => (releaseSession = resolve)))

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    const selectPlaceholder = await screen.findByTestId("checkout-customer-select-skeleton")
    assert.ok(screen.getByTestId("checkout-form-skeleton").contains(selectPlaceholder))
    assert.ok(selectPlaceholder.textContent?.includes(content.customerSelectLabel))

    await act(async () => releaseSession())
    await waitFor(() => assert.equal(screen.queryByTestId("checkout-form-skeleton"), null))
    assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null)
    assert.ok(screen.getByText(content.customerSelectLabel))
})

test("keeps Stripe elements hidden behind their placeholder until they report ready", async () => {
    respondWithCustomers([{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: "Ada" }])

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    const contactDetails = await screen.findByTestId("stripe-contact-details")
    const billingAddress = screen.getByTestId("stripe-billing-address")
    const slotOf = (element: HTMLElement) => element.closest("[inert]")
    assert.ok(slotOf(contactDetails)?.className.includes("invisible"))
    assert.ok(slotOf(billingAddress)?.className.includes("invisible"))

    act(() => contactDetailsOnReady?.())
    assert.equal(slotOf(contactDetails), null)
    assert.ok(slotOf(billingAddress))

    act(() => billingAddressOnReady?.())
    assert.equal(slotOf(billingAddress), null)
})

test("sizes the Stripe placeholders from the heights measured on an earlier visit", async () => {
    const measured = { contactDetails: 71, billingAddress: 412 }
    window.localStorage.setItem(
        "code0.checkout.elementHeights",
        JSON.stringify(Object.fromEntries(["desktop", "mobile"].flatMap((layout) => Object.entries(measured).map(([key, height]) => [`${layout}:${key}`, height]))))
    )
    respondWithCustomers([{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: "Ada" }])

    try {
        render(<CheckoutForm content={content} errors={errors} locale="en" />)
        await screen.findByTestId("stripe-contact-details")
        const placeholderHeights = Array.from(document.querySelectorAll<HTMLElement>("[aria-hidden='true'][style]")).map((element) => element.style.height)
        assert.deepEqual(placeholderHeights, ["71px", "412px"])
    } finally {
        window.localStorage.removeItem("code0.checkout.elementHeights")
    }
})

test("keeps the new customer form in place while the customer and its session are created", async () => {
    let releaseCreation = () => {}
    respondWithCustomers([], new Promise((resolve) => (releaseCreation = resolve)))

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await screen.findByTestId("standalone-address")
    const user = userEvent.setup()
    await user.type(screen.getByRole("textbox", { name: content.emailLabel }), "ada@example.com")
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    await user.click(screen.getByRole("button", { name: content.continueLabel }))

    assert.ok(screen.getByTestId("standalone-address"))
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.ok(screen.getByRole("button", { name: content.processingLabel }))

    await act(async () => releaseCreation())
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_layout"))
})

test("keeps the previous customer's form on screen until the new customer's session is ready", async () => {
    let releaseSecondSession = () => {}
    const secondSessionGate = new Promise<void>((resolve) => (releaseSecondSession = resolve))
    let sessionCount = 0
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === "/api/crater/customer" && init?.method !== "POST") {
            return Response.json({
                customers: [
                    { customerType: "personal", email: null, id: "gid://crater/Customer/1", name: "Ada" },
                    { customerType: "personal", email: null, id: "gid://crater/Customer/2", name: "Grace" },
                ],
            })
        }
        sessionCount += 1
        if (sessionCount === 2) await secondSessionGate
        return Response.json({ clientSecret: `cs_swap_${sessionCount}`, expiresAt: 1_800_000_000, id: `cs_swap_${sessionCount}` })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_swap_1"))
    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })

    act(() => customerSelectOnValueChange?.("gid://crater/Customer/2"))
    // While Crater creates the new session the previous form stays, dimmed and inert, instead of a skeleton.
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.equal(screen.getAllByTestId("stripe-billing-address").length, 1)
    assert.equal(screen.getByTestId("stripe-billing-address").closest("[aria-busy='true']")?.hasAttribute("inert"), true)

    await act(async () => releaseSecondSession())
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_swap_2"))
    // The new session loads invisibly next to the outgoing one, which is hidden from assistive technology.
    const addresses = screen.getAllByTestId("stripe-billing-address")
    assert.equal(addresses.length, 2)
    assert.equal(addresses[0].closest("[aria-hidden='true']") !== null, true)

    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })
    await waitFor(() => assert.equal(screen.getAllByTestId("stripe-billing-address").length, 1))
    assert.equal(screen.getByTestId("stripe-billing-address").closest("[aria-busy='true']"), null)
})

test("keeps the form on screen while a session about to expire is refreshed", async () => {
    let releaseRefresh = () => {}
    const refreshGate = new Promise<void>((resolve) => (releaseRefresh = resolve))
    let sessionCount = 0
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === "/api/crater/customer" && init?.method !== "POST") {
            return Response.json({ customers: [{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: "Ada" }] })
        }
        sessionCount += 1
        if (sessionCount === 2) await refreshGate
        // The first session is already inside the refresh lead time, so it is replaced right away.
        const expiresAt = sessionCount === 1 ? Math.floor(Date.now() / 1_000) + 30 : 1_800_000_000
        return Response.json({ clientSecret: `cs_refresh_${sessionCount}`, expiresAt, id: `cs_refresh_${sessionCount}` })
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await waitFor(() => assert.equal(sessionCount, 2))
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.ok(screen.getByTestId("stripe-billing-address"))

    await act(async () => releaseRefresh())
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_refresh_2"))
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
})

test("prefills the new customer address restored from the draft", async () => {
    saveCheckoutContactDraft({ billingAddress: stripeBillingAddress, customerId: null, email: "ada@example.com", searchParams: checkoutSearchParams, stage: "billingAddress" })
    globalThis.fetch = (async () => Response.json({ customers: [] })) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await screen.findByTestId("standalone-address")
    assert.deepEqual(standaloneAddressOptions?.defaultValues, { name: stripeBillingAddress.name, address: stripeBillingAddress.address })
    assert.equal((screen.getByRole("textbox", { name: content.emailLabel }) as HTMLInputElement).value, "ada@example.com")
})
