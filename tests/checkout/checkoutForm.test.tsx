import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()
const checkoutSearchParams = new URLSearchParams({
    customerType: "b2c",
    deploymentType: "self_hosted",
    paymentPeriod: "monthly",
    plan: "pro",
})
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
let paymentElementOptions: unknown = null
let paymentElementOnReady: (() => void) | null = null
let paymentElementOnChange: ((event: { complete: boolean }) => void) | null = null
let taxIdElementOptions: unknown = null
let stripeLoadOptions: unknown = null
let checkoutStages: string[] = []
let checkoutStage = "billingAddress"
const checkoutStageListeners = new Set<() => void>()
let stripeConfirmCalls = 0
let stripeConfirmErrorMessage: string | null = null
let stripeCheckoutLoadErrorMessage: string | null = null
let stripeConfirmOptions: unknown[] = []
let stripeBillingAddressUpdates: unknown[] = []
let stripeEmailUpdates: unknown[] = []
let customerSelectOnValueChange: ((value: string) => void) | null = null
const setCheckoutStage = (stage: string) => {
    checkoutStage = stage
    checkoutStages.push(stage)
    checkoutStageListeners.forEach((listener) => listener())
}

process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY = "pk_test_example"

mock.module("next/navigation", {
    namedExports: {
        useSearchParams: () => checkoutSearchParams,
        useParams: () => ({ locale: "en" }),
    },
})
mock.module("next/link", {
    defaultExport: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
})
mock.module("@/components/checkout/CraterSessionProvider", {
    namedExports: {
        useCraterSession: () => ({
            authenticated: true,
            error: null,
            isLoading: false,
        }),
    },
})
mock.module("@/components/checkout/CheckoutStage", {
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
mock.module("@/components/checkout/SendOfferDialog", {
    namedExports: {
        SendOfferDialog: ({ content }: { content: CheckoutData["form"] }) => <button type="button">{content.sendOfferLabel}</button>,
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
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
mock.module("@stripe/stripe-js", {
    namedExports: {
        loadStripe: (_publishableKey: string, options: unknown) => {
            stripeLoadOptions = options
            return Promise.resolve({})
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
        PaymentElement: ({
            onChange,
            onReady,
            options,
        }: {
            onChange?: (event: { complete: boolean }) => void
            onReady?: () => void
            options?: unknown
        }) => {
            paymentElementOptions = options
            paymentElementOnReady = onReady ?? null
            paymentElementOnChange = onChange ?? null
            return <div data-testid="stripe-payment">Payment details</div>
        },
        TaxIdElement: ({ options }: { options: unknown }) => {
            taxIdElementOptions = options
            return <div data-testid="stripe-tax-id">Tax ID</div>
        },
        useCheckoutElements: () =>
            stripeCheckoutLoadErrorMessage
                ? { type: "error", error: { message: stripeCheckoutLoadErrorMessage } }
                : {
                      type: "success",
                      checkout: {
                          email: null,
                          confirm: async (options: unknown) => {
                              stripeConfirmCalls += 1
                              stripeConfirmOptions.push(options)
                              if (stripeConfirmErrorMessage) return { type: "error", error: { message: stripeConfirmErrorMessage } }
                              return { type: "success", session: {} }
                          },
                          updateBillingAddress: async (address: unknown) => {
                              stripeBillingAddressUpdates.push(address)
                              return { type: "success", session: {} }
                          },
                          updateEmail: async (email: unknown) => {
                              stripeEmailUpdates.push(email)
                              return { type: "success", session: {} }
                          },
                      },
                  },
    },
})

const { act, cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutForm } = await import("../../src/components/checkout/CheckoutForm")

const originalFetch = globalThis.fetch
afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    checkoutSearchParams.set("customerType", "b2c")
    checkoutSearchParams.delete("promotionCode")
    checkoutProviderOptions = null
    billingAddressOnChange = null
    contactDetailsOnChange = null
    billingAddressOptions = null
    paymentElementOptions = null
    paymentElementOnReady = null
    paymentElementOnChange = null
    taxIdElementOptions = null
    checkoutStages = []
    checkoutStage = "billingAddress"
    stripeConfirmCalls = 0
    stripeConfirmErrorMessage = null
    stripeCheckoutLoadErrorMessage = null
    stripeConfirmOptions = []
    stripeBillingAddressUpdates = []
    stripeEmailUpdates = []
    customerSelectOnValueChange = null
})

const errors = {
    sessionUnavailable: "Session unavailable",
    customerCreation: "Customer creation failed",
    customerTypeMismatch: "Customer type mismatch",
    checkoutCustomer: "Invalid checkout customer",
    checkoutSession: "Checkout session failed",
    checkoutSessionExpired: "Checkout session expired",
    billingAddressUpdate: "Billing address update failed",
    emailUpdate: "Email update failed",
    taxIdUpdate: "Tax ID update failed",
    taxIdIncomplete: "Tax ID fields must be provided together",
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

test("creates the customer and checkout session on mount before collecting Stripe billing details", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ init, url: String(input) })

        if (String(input) === "/api/crater/customer") {
            const isCreate = init?.method === "POST"
            return new Response(JSON.stringify(isCreate ? { customerType: "personal", email: null, id: "gid://crater/Customer/1", name: null } : { customers: [] }), {
                status: isCreate ? 201 : 200,
                headers: { "content-type": "application/json" },
            })
        }

        if (String(input) === "/api/crater/checkout/tax") {
            return new Response(JSON.stringify({ amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        }

        return new Response(JSON.stringify({ clientSecret: "cs_test_secret", expiresAt: 1_800_000_000, id: "cs_test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} errors={errors} locale="en" />)
    assert.ok(screen.getByTestId("checkout-form-skeleton"))
    assert.ok(screen.getByTestId("checkout-customer-select-skeleton"))

    await waitFor(() => assert.equal(requests.length, 4))
    assert.deepEqual(
        requests.map((request) => request.url),
        ["/api/crater/customer", "/api/crater/customer", "/api/crater/checkout/session", "/api/crater/checkout/tax"]
    )
    assert.equal(new Headers(requests[0].init?.headers).get("authorization"), null)
    assert.equal(requests[0].init?.credentials, "same-origin")
    assert.equal(requests[2].init?.credentials, "same-origin")
    const customerCreationBody = JSON.parse(String(requests[1].init?.body)) as Record<string, unknown>
    assert.equal(customerCreationBody.customerType, "personal")
    assert.equal(customerCreationBody.draft, true)
    assert.match(String(customerCreationBody.checkoutKey), /^[0-9a-f-]{36}$/i)
    assert.deepEqual(JSON.parse(String(requests[2].init?.body)), {
        customerId: "gid://crater/Customer/1",
        customerType: "b2c",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret")
    assert.equal(checkoutProviderOptions?.defaultValues, undefined)
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.theme, "night")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.variables?.colorPrimary, "#72f896")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.variables?.focusBoxShadow, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.variables?.focusOutline, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.variables?.inputFocusBoxShadow, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Dropdown"]?.backgroundColor, "#191825")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".DropdownItem--highlight"]?.backgroundColor, "#201e2c")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Input"]?.backgroundColor, "#272532")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Input:focus"]?.outline, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Input:focus"]?.boxShadow, "none")
    assert.equal(
        checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Input:focus"]?.backgroundColor,
        checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Input:hover"]?.backgroundColor
    )
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Tab:focus"]?.outline, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Tab"]?.backgroundColor, "#191825")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".Tab:focus"]?.backgroundColor, "#2b2938")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem:focus-visible"]?.outline, "none")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem"]?.backgroundColor, "#191825")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem:focus-visible"]?.backgroundColor, "#2b2938")
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem--selected"]?.backgroundColor, "#201e2c")
    assert.equal(
        checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem--selected"]?.backgroundColor,
        checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem:hover"]?.backgroundColor
    )
    assert.equal(checkoutProviderOptions?.elementsOptions?.appearance?.rules?.[".AccordionItem--selected"]?.boxShadow, "none")
    assert.deepEqual(billingAddressOptions, { display: { name: "full" } })
    assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null)
    assert.equal(screen.queryByText(content.customerSelectLabel), null)
    assert.equal(screen.queryByText(content.newCustomerLabel), null)
    assert.ok(screen.getByTestId("stripe-contact-details"))
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.equal(screen.queryByTestId("stripe-tax-id"), null)
    assert.equal(screen.queryByTestId("stripe-payment"), null)
    assert.equal(checkoutStages.includes("payment"), false)
    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, true)

    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, true)
    act(() => contactDetailsOnChange?.({ complete: true, value: { email: "ada@example.com" } }))
    assert.equal(screen.queryByTestId("stripe-payment"), null)
    assert.equal(checkoutStages.includes("payment"), false)
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    assert.ok(await screen.findByTestId("stripe-payment"))
    assert.deepEqual(paymentElementOptions, { fields: { billingDetails: { name: "never", address: "never" } } })
    assert.equal((screen.getByRole("button", { name: "Pay now" }) as HTMLButtonElement).disabled, true)
    act(() => paymentElementOnReady?.())
    assert.equal((screen.getByRole("button", { name: "Pay now" }) as HTMLButtonElement).disabled, true)
    act(() => paymentElementOnChange?.({ complete: true }))
    assert.equal((screen.getByRole("button", { name: "Pay now" }) as HTMLButtonElement).disabled, true)
    await user.click(screen.getByRole("checkbox"))
    assert.equal((screen.getByRole("button", { name: "Pay now" }) as HTMLButtonElement).disabled, false)
    assert.deepEqual(stripeBillingAddressUpdates, [stripeBillingAddress])
    assert.deepEqual(stripeEmailUpdates, ["ada@example.com"])
    assert.equal(screen.queryByTestId("stripe-contact-details"), null)
    assert.equal(screen.queryByTestId("stripe-billing-address"), null)
    assert.equal(checkoutStages.at(-1), "payment")

    await user.click(screen.getByRole("button", { name: content.backToBillingLabel }))
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.ok(screen.getByTestId("stripe-contact-details"))
    assert.equal(screen.queryByTestId("stripe-payment"), null)
    assert.equal(checkoutStages.at(-1), "billingAddress")

    act(() => billingAddressOnChange?.({ complete: false, value: stripeBillingAddress }))
    assert.equal(screen.queryByTestId("stripe-payment"), null)
    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, true)

    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))
    assert.equal((screen.getByRole("button", { name: "Pay now" }) as HTMLButtonElement).disabled, true)
    act(() => paymentElementOnReady?.())
    act(() => paymentElementOnChange?.({ complete: true }))

    stripeConfirmErrorMessage = "Your payment could not be confirmed."
    await user.click(screen.getByRole("button", { name: "Pay now" }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 1))
    assert.ok(screen.getByText(errors.paymentConfirmation))
    assert.equal(screen.queryByText("Your payment could not be confirmed."), null)

    stripeConfirmErrorMessage = null
    await user.click(screen.getByRole("button", { name: "Pay now" }))
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

        if (url === "/api/crater/checkout/tax") {
            return new Response(JSON.stringify({ amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }), {
                status: 200,
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
    assert.ok(screen.getByTestId("checkout-customer-select-skeleton"))
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
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_customer_3"))
    act(() => {
        contactDetailsOnReady?.()
        billingAddressOnReady?.()
    })
    await waitFor(() => assert.equal(screen.queryByTestId("checkout-customer-select-skeleton"), null))
    assert.equal(screen.getAllByText(content.newCustomerLabel).length, 1)

    const sessionBodies = requests.filter((request) => request.url === "/api/crater/checkout/session").map((request) => JSON.parse(String(request.init?.body)) as { customerId: string })
    assert.deepEqual(
        sessionBodies.map((body) => body.customerId),
        ["gid://crater/Customer/1", "gid://crater/Customer/2", "gid://crater/Customer/3"]
    )
    const customerCreationRequests = requests.filter((request) => request.url === "/api/crater/customer" && request.init?.method === "POST")
    assert.equal(customerCreationRequests.length, 1)
    const customerCreationBody = JSON.parse(String(customerCreationRequests[0].init?.body)) as Record<string, unknown>
    assert.equal(customerCreationBody.customerType, "personal")
    assert.equal(customerCreationBody.draft, true)
    assert.match(String(customerCreationBody.checkoutKey), /^[0-9a-f-]{36}$/i)
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

        if (url === "/api/crater/checkout/tax") {
            return new Response(JSON.stringify({ amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }), {
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

        if (url === "/api/crater/checkout/tax") {
            return new Response(JSON.stringify({ amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }), {
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

test("shows only the configured error when Stripe cannot load the checkout session", async () => {
    stripeCheckoutLoadErrorMessage = "The Checkout Session could not be loaded."
    globalThis.fetch = (async (input) => {
        const url = String(input)
        return new Response(
            JSON.stringify(
                url === "/api/crater/customer"
                    ? { customers: [{ customerType: "personal", email: "ada@example.com", id: "gid://crater/Customer/1", name: "Ada Lovelace" }] }
                    : url === "/api/crater/checkout/tax"
                      ? { amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }
                      : { clientSecret: "cs_load_error", expiresAt: 1_800_000_000, id: "cs_load_error" }
            ),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    assert.ok(await screen.findByText(errors.checkoutSession))
    assert.equal(screen.queryByText(content.customerSelectLabel), null)
    assert.equal(screen.queryByTestId("stripe-contact-details"), null)
    assert.equal(screen.queryByTestId("stripe-billing-address"), null)
    assert.equal(screen.queryByTestId("checkout-form-skeleton"), null)
    assert.equal(screen.queryByRole("button"), null)
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
                    : url === "/api/crater/checkout/tax"
                      ? { amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }
                      : { clientSecret: "cs_test_business_secret", expiresAt: 1_800_000_000, id: "cs_test_business" }
            ),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.length, 3))
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
        customerId: "gid://crater/Customer/2",
        customerType: "b2b",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    assert.ok(screen.getByTestId("stripe-contact-details"))
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.ok(screen.getByTestId("stripe-tax-id"))
    assert.ok(screen.getByRole("button", { name: content.sendOfferLabel }))
    assert.deepEqual(taxIdElementOptions, { fields: { businessName: "never" }, visibility: "auto" })
    assert.deepEqual(stripeLoadOptions, { betas: ["custom_checkout_tax_id_1"], locale: "en" })
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    act(() => contactDetailsOnChange?.({ complete: true, value: { email: "billing@example.com" } }))
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    assert.ok(await screen.findByTestId("stripe-payment"))
    assert.equal(screen.queryByRole("button", { name: content.sendOfferLabel }), null)
})

test("shows only the configured error when automatic customer creation fails", async () => {
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
    assert.equal(screen.queryByRole("button"), null)
})

test("recreates only the checkout session when the promotion code changes or is removed", async () => {
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

        if (url === "/api/crater/checkout/tax") {
            return new Response(JSON.stringify({ amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }), {
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
    const view = render(<CheckoutForm content={content} errors={errors} locale="en" />)
    await waitFor(() => assert.equal(requests.length, 3))

    act(() => setCheckoutStage("payment"))
    checkoutSearchParams.set("promotionCode", "SAVE10")
    view.rerender(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 2))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer").length, 1)
    assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 2)
    assert.deepEqual(JSON.parse(String(requests.filter((request) => request.url === "/api/crater/checkout/session").at(-1)?.init?.body)), {
        customerId: "gid://crater/Customer/1",
        customerType: "b2c",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
        promotionCode: "SAVE10",
    })
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret_2"))
    assert.equal(checkoutStage, "payment")

    checkoutSearchParams.delete("promotionCode")
    view.rerender(<CheckoutForm content={content} errors={errors} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 3))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer").length, 1)
    assert.deepEqual(JSON.parse(String(requests.filter((request) => request.url === "/api/crater/checkout/session").at(-1)?.init?.body)), {
        customerId: "gid://crater/Customer/1",
        customerType: "b2c",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret_3"))
})
