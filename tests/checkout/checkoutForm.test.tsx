import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData } from "@/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()
const checkoutSearchParams = new URLSearchParams({
    customerType: "b2c",
    deploymentType: "self_hosted",
    paymentPeriod: "monthly",
    plan: "pro",
})
let checkoutProviderOptions: { clientSecret?: string; defaultValues?: unknown; elementsOptions?: { appearance?: { theme?: string; variables?: Record<string, string> } } } | null = null
const stripeBillingAddress = {
    name: "Ada Lovelace",
    address: { city: "Berlin", country: "DE", line1: "Teststraße 1", line2: null, postal_code: "10115", state: "Berlin" },
}
let billingAddressOnChange: ((event: { complete: boolean; value: typeof stripeBillingAddress }) => void) | null = null
let contactDetailsOnChange: ((event: { complete: boolean; value: { email: string } }) => void) | null = null
let billingAddressOptions: unknown = null
let paymentElementOptions: unknown = null
let checkoutStages: string[] = []
let checkoutStage = "billingAddress"
const checkoutStageListeners = new Set<() => void>()
let stripeConfirmCalls = 0
let stripeConfirmErrorMessage: string | null = null
let stripeCheckoutLoadErrorMessage: string | null = null
let stripeConfirmOptions: unknown[] = []
let stripeBillingAddressUpdates: unknown[] = []
let stripeEmailUpdates: unknown[] = []
let stripeTaxIdUpdates: unknown[] = []
const setCheckoutStage = (stage: string) => {
    checkoutStage = stage
    checkoutStages.push(stage)
    checkoutStageListeners.forEach((listener) => listener())
}

process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY = "pk_test_example"

mock.module("next/navigation", {
    namedExports: {
        useSearchParams: () => checkoutSearchParams,
    },
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
mock.module("@/components/checkout/CheckoutStepper", {
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
        }),
    },
})
mock.module("@code0-tech/pictor", {
    namedExports: {
        Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
        EmailInput: TestInput,
        TextInput: TestInput,
        emailValidation: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        useForm: useTestForm,
    },
})
mock.module("@stripe/stripe-js", {
    namedExports: {
        loadStripe: () => Promise.resolve({}),
    },
})
mock.module("@stripe/react-stripe-js/checkout", {
    namedExports: {
        BillingAddressElement: ({ onChange, options }: { onChange: (event: { complete: boolean; value: typeof stripeBillingAddress }) => void; options?: unknown }) => {
            billingAddressOnChange = onChange
            billingAddressOptions = options
            return <div data-testid="stripe-billing-address">Billing address</div>
        },
        CheckoutElementsProvider: ({
            children,
            options,
        }: {
            children: React.ReactNode
            options: { clientSecret: string; defaultValues?: unknown; elementsOptions?: { appearance?: { theme?: string; variables?: Record<string, string> } } }
        }) => {
            checkoutProviderOptions = options
            return <>{children}</>
        },
        ContactDetailsElement: ({ onChange }: { onChange: (event: { complete: boolean; value: { email: string } }) => void }) => {
            contactDetailsOnChange = onChange
            return <div data-testid="stripe-contact-details">Contact details</div>
        },
        PaymentElement: ({ options }: { options?: unknown }) => {
            paymentElementOptions = options
            return <div data-testid="stripe-payment">Payment details</div>
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
                updateTaxIdInfo: async (taxIdInfo: unknown) => {
                    stripeTaxIdUpdates.push(taxIdInfo)
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
    checkoutStages = []
    checkoutStage = "billingAddress"
    stripeConfirmCalls = 0
    stripeConfirmErrorMessage = null
    stripeCheckoutLoadErrorMessage = null
    stripeConfirmOptions = []
    stripeBillingAddressUpdates = []
    stripeEmailUpdates = []
    stripeTaxIdUpdates = []
})

const content = {
    billingHeading: "Billing information",
    paymentHeading: "Payment",
    continueLabel: "Continue to payment",
    backToBillingLabel: "Back",
    payNowLabel: "Pay now",
    processingLabel: "Processing",
    paymentErrorFallback: "Checkout failed",
    errors: {
        sessionUnavailable: "Session unavailable",
        customerCreation: "Customer creation failed",
        customerTypeMismatch: "Customer type mismatch",
        checkoutSession: "Checkout session failed",
        checkoutSessionExpired: "Checkout session expired",
        billingAddressUpdate: "Billing address update failed",
        emailUpdate: "Email update failed",
        taxIdUpdate: "Tax ID update failed",
        taxIdIncomplete: "Tax ID fields must be provided together",
        paymentConfirmation: "Payment confirmation failed",
        discountSessionRequired: "Discount session required",
        discountValidation: "Discount validation failed",
    },
    mobileContactLabel: "Contact details",
    mobileNextLabel: "Continue",
    mobileTaxLabel: "Tax details",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone",
    phonePlaceholder: "+49",
    line1Label: "Address",
    line1Placeholder: "Street and number",
    line2Label: "Address line 2",
    line2Placeholder: "Apartment",
    cityLabel: "City",
    stateLabel: "State",
    statePlaceholder: "State",
    postalCodeLabel: "Postal code",
    countryLabel: "Country",
    countryPlaceholder: "DE",
    countryEmptyLabel: "No country found.",
    taxIdTypeLabel: "Tax ID type",
    taxIdTypePlaceholder: "eu_vat",
    taxIdValueLabel: "Tax ID",
    taxIdValuePlaceholder: "DE123",
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
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
                status: 201,
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
    render(<CheckoutForm content={content} locale="en" />)
    assert.ok(screen.getByTestId("checkout-form-skeleton"))

    await waitFor(() => assert.equal(requests.length, 3))
    assert.deepEqual(
        requests.map((request) => request.url),
        ["/api/crater/customer", "/api/crater/checkout/session", "/api/crater/checkout/tax"]
    )
    assert.equal(new Headers(requests[0].init?.headers).get("authorization"), null)
    assert.equal(requests[0].init?.credentials, "same-origin")
    assert.equal(requests[1].init?.credentials, "same-origin")
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { customerType: "personal" })
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
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
    assert.deepEqual(billingAddressOptions, { display: { name: "full" } })
    assert.ok(screen.getByTestId("stripe-contact-details"))
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.equal(screen.queryByRole("textbox", { name: "Tax ID type" }), null)
    assert.equal(screen.queryByRole("textbox", { name: "Tax ID" }), null)
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

    stripeConfirmErrorMessage = "Your payment could not be confirmed."
    await user.click(screen.getByRole("button", { name: "Pay now" }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 1))
    assert.ok(screen.getByText(content.errors.paymentConfirmation))
    assert.equal(screen.queryByText("Your payment could not be confirmed."), null)

    stripeConfirmErrorMessage = null
    await user.click(screen.getByRole("button", { name: "Pay now" }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 2))
    assert.deepEqual(stripeConfirmOptions, [{ redirect: "always" }, { redirect: "always" }])
})

test("replaces a checkout session shortly before it expires", async () => {
    const requests: string[] = []
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input) => {
        const url = String(input)
        requests.push(url)

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
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

    render(<CheckoutForm content={content} locale="en" />)

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
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
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

        checkoutSessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_inactive_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_inactive_${checkoutSessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    render(<CheckoutForm content={content} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((url) => url === "/api/crater/checkout/session").length, 2))
    await new Promise((resolve) => setTimeout(resolve, 25))
    assert.equal(requests.filter((url) => url === "/api/crater/checkout/session").length, 2)
    assert.equal(requests.filter((url) => url === "/api/crater/customer").length, 1)
})

test("creates a business customer and updates optional tax details before payment", async () => {
    checkoutSearchParams.set("customerType", "b2b")
    const requests: Array<{ init?: RequestInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        requests.push({ init, url })
        return new Response(
            JSON.stringify(
                url === "/api/crater/customer"
                    ? { id: "gid://crater/Customer/2" }
                    : url === "/api/crater/checkout/tax"
                      ? { amountTotal: 11_900, currency: "eur", taxAmountExclusive: 1_900 }
                    : { clientSecret: "cs_test_business_secret", expiresAt: 1_800_000_000, id: "cs_test_business" }
            ),
            { status: url === "/api/crater/customer" ? 201 : 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch
    const user = userEvent.setup()
    render(<CheckoutForm content={content} locale="en" />)

    await waitFor(() => assert.equal(requests.length, 3))
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { customerType: "business" })
    assert.ok(screen.getByTestId("stripe-contact-details"))
    assert.ok(screen.getByTestId("stripe-billing-address"))
    await user.type(screen.getByRole("textbox", { name: "Tax ID type" }), "eu_vat")
    await user.type(screen.getByRole("textbox", { name: "Tax ID" }), "DE123456789")
    act(() => billingAddressOnChange?.({ complete: true, value: stripeBillingAddress }))
    act(() => contactDetailsOnChange?.({ complete: true, value: { email: "billing@example.com" } }))
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    assert.ok(await screen.findByTestId("stripe-payment"))
    assert.deepEqual(stripeTaxIdUpdates, [
        {
            businessName: "Ada Lovelace",
            taxId: { type: "eu_vat", value: "DE123456789" },
        },
    ])
})

test("shows automatic customer creation failures and allows retrying", async () => {
    let requestCount = 0
    globalThis.fetch = (async () => {
        requestCount += 1
        return new Response(JSON.stringify({ error: "Crater rejected the customer." }), {
            status: 422,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    const user = userEvent.setup()

    render(<CheckoutForm content={content} locale="en" />)
    assert.ok(await screen.findByText(content.errors.customerCreation))
    assert.equal(screen.queryByText("Crater rejected the customer."), null)
    assert.equal(requestCount, 1)
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))
    await waitFor(() => assert.equal(requestCount, 2))
})

test("recreates only the checkout session when the promotion code changes or is removed", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    let checkoutSessionCount = 0
    globalThis.fetch = (async (input, init) => {
        const url = String(input)
        requests.push({ init, url })

        if (url === "/api/crater/customer") {
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
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

        checkoutSessionCount += 1
        return new Response(JSON.stringify({ clientSecret: `cs_test_secret_${checkoutSessionCount}`, expiresAt: 1_800_000_000, id: `cs_test_${checkoutSessionCount}` }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    const view = render(<CheckoutForm content={content} locale="en" />)
    await waitFor(() => assert.equal(requests.length, 3))

    checkoutSearchParams.set("promotionCode", "SAVE10")
    view.rerender(<CheckoutForm content={content} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 2))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer").length, 1)
    assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 2)
    assert.deepEqual(JSON.parse(String(requests.filter((request) => request.url === "/api/crater/checkout/session").at(-1)?.init?.body)), {
        customerType: "b2c",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
        promotionCode: "SAVE10",
    })
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret_2"))

    checkoutSearchParams.delete("promotionCode")
    view.rerender(<CheckoutForm content={content} locale="en" />)

    await waitFor(() => assert.equal(requests.filter((request) => request.url === "/api/crater/checkout/session").length, 3))
    assert.equal(requests.filter((request) => request.url === "/api/crater/customer").length, 1)
    assert.deepEqual(JSON.parse(String(requests.filter((request) => request.url === "/api/crater/checkout/session").at(-1)?.init?.body)), {
        customerType: "b2c",
        deploymentType: "self_hosted",
        locale: "en",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    await waitFor(() => assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret_3"))
})
