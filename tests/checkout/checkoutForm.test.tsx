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
let checkoutProviderOptions: { clientSecret?: string } | null = null
let stripeConfirmCalls = 0

process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY = "pk_test_example"

mock.module("next/navigation", {
    namedExports: {
        useSearchParams: () => checkoutSearchParams,
    },
})
mock.module("@/components/checkout/CraterSessionProvider", {
    namedExports: {
        useCraterSession: () => ({
            error: null,
            isLoading: false,
            token: "crater-session-token",
        }),
    },
})
mock.module("@/components/checkout/CheckoutStepper", {
    namedExports: {
        useCheckoutStage: () => ({ stage: "billingAddress", setStage: () => {} }),
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
        BillingAddressElement: () => <div data-testid="stripe-billing-address">Billing address</div>,
        CheckoutElementsProvider: ({ children, options }: { children: React.ReactNode; options: { clientSecret: string } }) => {
            checkoutProviderOptions = options
            return <>{children}</>
        },
        PaymentElement: () => <div data-testid="stripe-payment">Payment details</div>,
        useCheckoutElements: () => ({
            type: "success",
            checkout: {
                confirm: async () => {
                    stripeConfirmCalls += 1
                    return { type: "success", session: {} }
                },
            },
        }),
    },
})

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutForm } = await import("../../src/components/checkout/CheckoutForm")

const originalFetch = globalThis.fetch
afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    checkoutSearchParams.set("customerType", "b2c")
    checkoutProviderOptions = null
    stripeConfirmCalls = 0
})

const content = {
    billingHeading: "Billing information",
    paymentHeading: "Payment",
    continueLabel: "Continue to payment",
    backToBillingLabel: "Back",
    payNowLabel: "Pay now",
    processingLabel: "Processing",
    paymentErrorFallback: "Checkout failed",
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

test("disables checkout until all required billing fields are valid", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response()
    }) as typeof fetch

    render(<CheckoutForm content={content} locale="en" />)

    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, true)
    assert.equal(requests.length, 0)
})

test("shows contact details as the personal mobile billing step", async () => {
    const user = userEvent.setup()

    render(<CheckoutForm content={content} locale="en" mobileSteps />)

    const contactStep = screen.getByRole("button", { name: /Contact details/ })
    assert.equal(contactStep.getAttribute("aria-expanded"), "true")
    assert.equal(screen.queryByRole("button", { name: /Address/ }), null)
    assert.equal(screen.queryByRole("button", { name: /Tax details/ }), null)

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada Lovelace")
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.com")
    assert.equal((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled, false)
})

test("shows tax fields as the final mobile step for business customers", async () => {
    checkoutSearchParams.set("customerType", "b2b")
    const user = userEvent.setup()

    render(<CheckoutForm content={content} locale="en" mobileSteps />)

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Code0 GmbH")
    await user.type(screen.getByRole("textbox", { name: "Email" }), "billing@code0.tech")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    assert.equal(screen.getByRole("button", { name: /Tax details/ }).getAttribute("aria-expanded"), "true")
    assert.ok(screen.getByRole("textbox", { name: "Tax ID type" }))
    assert.ok(screen.getByRole("textbox", { name: "Tax ID" }))
})

test("creates the customer without an address and mounts Stripe checkout elements", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    globalThis.fetch = (async (input, init) => {
        requests.push({ init, url: String(input) })

        if (String(input) === "/api/crater/customer") {
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
                status: 201,
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

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada Lovelace")
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    await waitFor(() => assert.equal(requests.length, 2))
    assert.deepEqual(
        requests.map((request) => request.url),
        ["/api/crater/customer", "/api/crater/checkout/session"]
    )
    assert.equal(new Headers(requests[0].init?.headers).get("authorization"), "Session crater-session-token")
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), {
        customerType: "personal",
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "",
    })
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
        customerType: "b2c",
        deploymentType: "self_hosted",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    assert.equal(checkoutProviderOptions?.clientSecret, "cs_test_secret")
    assert.ok(screen.getByTestId("stripe-billing-address"))
    assert.ok(screen.getByTestId("stripe-payment"))

    await user.click(screen.getByRole("button", { name: "Pay now" }))
    await waitFor(() => assert.equal(stripeConfirmCalls, 1))
})
