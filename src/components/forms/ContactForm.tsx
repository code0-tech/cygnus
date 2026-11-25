"use client"

import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import type { AppLocale } from "@/lib/i18n"
import { Alert, Button, EmailInput, emailValidation, TextAreaInput, TextInput, useForm } from "@code0-tech/pictor"
import type { FocusEvent } from "react"
import { useMemo, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface ContactFormContent {
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    submitLabel: string
}

interface ContactFormProps {
    content?: Partial<ContactFormContent> | null
    locale: AppLocale
}

interface ContactFormValues {
    name: string
    email: string
    message: string
    acceptTerms: boolean
}

const defaultContent: ContactFormContent = {
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    messageLabel: "Message",
    messagePlaceholder: "How can we help you?",
    submitLabel: "Send message",
}

export function ContactForm({ content, locale }: ContactFormProps) {
    const { trigger } = useWebHaptics()
    const labels = { ...defaultContent, ...content }

    const [isSubmitting, setIsSubmitting] = useState(false)
    // Bumped after a successful submit to remount the checkbox, which keeps its own checked state.
    const [termsCheckboxKey, setTermsCheckboxKey] = useState(0)
    const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const initialValues = useMemo<ContactFormValues>(
        () => ({
            name: "",
            email: "",
            message: "",
            acceptTerms: false,
        }),
        []
    )

    const validation = useMemo(
        () => ({
            name: (value: string) => {
                if (!value.trim()) return "Name is required"
                return null
            },
            email: (value: string) => {
                if (!value.trim()) return "Email is required"
                if (!emailValidation(value.trim())) return "Please provide a valid email"
                return null
            },
            message: (value: string) => {
                if (!value.trim()) return "Message is required"
                return null
            },
            acceptTerms: (value: boolean) => {
                if (!value) return locale === "de" ? "Bitte akzeptiere die Bedingungen." : "Please accept the terms."
                return null
            },
        }),
        [locale]
    )

    const [inputs, validate, values] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: ContactFormValues) => {
            if (isSubmitting) return

            setIsSubmitting(true)
            setSubmitStatus(null)

            void (async () => {
                try {
                    const response = await fetch("/api/contact", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(values),
                    })

                    if (!response.ok) {
                        const errorText = await response.text().catch(() => "")
                        throw new Error(errorText || "Failed to send message.")
                    }

                    inputs.getInputProps("name").formValidation?.setValue?.("")
                    inputs.getInputProps("email").formValidation?.setValue?.("")
                    inputs.getInputProps("message").formValidation?.setValue?.("")
                    inputs.getInputProps("acceptTerms").formValidation?.setValue?.(false)
                    setTermsCheckboxKey((key) => key + 1)
                    setSubmitStatus({ type: "success", message: "Message sent successfully." })
                } catch (error) {
                    console.error("Contact form submit error:", error)
                    setSubmitStatus({
                        type: "error",
                        message: "Sending failed. Please try again.",
                    })
                } finally {
                    setIsSubmitting(false)
                }
            })()
        },
    })
    const nameInputProps = inputs.getInputProps("name")
    const emailInputProps = inputs.getInputProps("email")
    const messageInputProps = inputs.getInputProps("message")
    const acceptTermsInputProps = inputs.getInputProps("acceptTerms")
    // Same rules as the validation above, run on the live values: the button stays disabled until every field is valid
    // and the terms are accepted. The API validates all of this again server-side.
    const canSubmit = [validation.name(values.name), validation.email(values.email), validation.message(values.message), validation.acceptTerms(values.acceptTerms)].every((error) => error === null)

    return (
        <div className="min-w-0 space-y-4 rounded-3xl bg-light p-4 shadow-[inset_0_1px_1px_#bfbfbf1a]">
            <TextInput
                maxLength={100}
                placeholder={labels.namePlaceholder}
                title={labels.nameLabel}
                onChange={() => {
                    if (!nameInputProps.formValidation?.valid) {
                        validate("name")
                    }
                }}
                {...nameInputProps}
            />
            <EmailInput
                maxLength={254}
                placeholder={labels.emailPlaceholder}
                title={labels.emailLabel}
                onChange={() => {
                    if (!emailInputProps.formValidation?.valid) {
                        validate("email")
                    }
                }}
                onBlur={(event: FocusEvent<HTMLInputElement>) => {
                    const value = event.currentTarget.value?.trim()
                    if (value && !emailValidation(value)) {
                        validate("email")
                    }
                }}
                {...emailInputProps}
            />
            <TextAreaInput
                maxLength={5000}
                placeholder={labels.messagePlaceholder}
                title={labels.messageLabel}
                onChange={() => {
                    if (!messageInputProps.formValidation?.valid) {
                        validate("message")
                    }
                }}
                {...messageInputProps}
            />
            <AcceptTermsCheckbox
                key={termsCheckboxKey}
                locale={locale}
                revalidateOnToggle={() => validate("acceptTerms")}
                {...acceptTermsInputProps}
            />
            <Button
                type="submit"
                variant="normal"
                className="mt-2 h-12! w-full! bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90! lg:h-10!"
                onClick={() => {
                    trigger("heavy")
                    validate()
                }}
                disabled={isSubmitting || !canSubmit}
            >
                {labels.submitLabel}
            </Button>
            {submitStatus && (
                <Alert color={submitStatus.type} className="mt-2">
                    {submitStatus.message}
                </Alert>
            )}
        </div>
    )
}
