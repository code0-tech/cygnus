import assert from "node:assert/strict"
import test, { afterEach, mock } from "node:test"
import React from "react"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { installDomTestEnvironment } from "./domTestEnvironment"

const domWindow = installDomTestEnvironment()
const checkoutSearchParams = new URLSearchParams({
    customerType: "b2c",
    deploymentType: "self_hosted",
    paymentPeriod: "monthly",
    plan: "pro",
})

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
mock.module("@/components/checkout/CountryPicker", {
    namedExports: {
        CountryPicker: ({
            errorMessage,
            label,
            onValueChange,
            value,
        }: {
            errorMessage?: string | null
            label: string
            onValueChange: (value: string) => void
            value: string
        }) => (
            <label>
                <span>{label}</span>
                <input aria-label={label} value={value} onChange={(event) => onValueChange(event.currentTarget.value.toUpperCase())} />
                {errorMessage && <span>{errorMessage}</span>}
            </label>
        ),
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

const { cleanup, render, screen, waitFor } = await import("@testing-library/react")
const userEvent = (await import("@testing-library/user-event")).default
const { CheckoutForm } = await import("../../src/components/checkout/CheckoutForm")

const originalFetch = globalThis.fetch
const originalAssign = domWindow.location.assign

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    domWindow.location.assign = originalAssign
})

const content = {
    billingHeading: "Billing information",
    paymentHeading: "Payment",
    continueLabel: "Continue to payment",
    backToBillingLabel: "Back",
    payNowLabel: "Pay now",
    processingLabel: "Processing",
    paymentErrorFallback: "Checkout failed",
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

const subscriptionConfig = {
    aiTokens: {
        b2b: { min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { min: 10_000, max: 100_000, step: 10_000 },
    },
    workflowExecutions: {
        b2b: { min: 200, max: 10_000, step: 100 },
        b2c: { min: 10, max: 1_000, step: 10 },
    },
} as SubscriptionConfigData

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

test("validates billing fields before creating a customer", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response()
    }) as typeof fetch
    const user = userEvent.setup()

    render(<CheckoutForm content={content} locale="en" subscriptionConfig={subscriptionConfig} />)
    await user.click(screen.getByRole("button", { name: "Continue to payment" }))

    await waitFor(() => assert.ok(screen.getByText("Name is required")))
    assert.equal(requests.length, 0)
})

test("creates the customer, sends the checkout selection, and redirects to the returned URL", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    const assignedUrls: string[] = []
    domWindow.location.assign = (url) => assignedUrls.push(String(url))
    globalThis.fetch = (async (input, init) => {
        requests.push({ init, url: String(input) })

        if (String(input) === "/api/crater/customer") {
            return new Response(JSON.stringify({ id: "gid://crater/Customer/1" }), {
                status: 201,
                headers: { "content-type": "application/json" },
            })
        }

        return new Response(JSON.stringify({ url: "https://checkout.stripe.com/session" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch
    const user = userEvent.setup()

    render(<CheckoutForm content={content} locale="en" subscriptionConfig={subscriptionConfig} />)

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada Lovelace")
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.com")
    await user.type(screen.getByRole("textbox", { name: "Address" }), "Example Street 1")
    await user.type(screen.getByRole("textbox", { name: "Postal code" }), "10115")
    await user.type(screen.getByRole("textbox", { name: "City" }), "Berlin")
    await user.type(screen.getByRole("textbox", { name: "Country" }), "de")
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
        address: {
            line1: "Example Street 1",
            line2: "",
            city: "Berlin",
            state: "",
            postalCode: "10115",
            country: "DE",
        },
    })
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
        customerType: "b2c",
        deploymentType: "self_hosted",
        paymentPeriod: "monthly",
        plan: "pro",
    })
    assert.deepEqual(assignedUrls, ["https://checkout.stripe.com/session"])
})
