"use client"

import { AcceptTermsCheckbox } from "@/components/AcceptTermsCheckbox"
import type { AppLocale } from "@/lib/i18n"
import { Button, EmailInput, emailValidation, TextAreaInput, TextInput, useForm } from "@code0-tech/pictor"
import { useMemo, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface ContactFormContent {
    heading: string
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

const defaultContent: ContactFormContent = {
    heading: "Contact us",
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
    const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error", message: string } | null>(null)
    const initialValues = useMemo(() => ({
        name: "",
        email: "",
        message: "",
        acceptTerms: false,
    }), [])

    const validation = useMemo(() => ({
        name: (value: string) => {
            if (!value) return "Name is required"
            return null
        },
        email: (value: string) => {
            if (!value) return "Email is required"
            if (!emailValidation(value)) return "Please provide a valid email"
            return null
        },
        message: (value: string) => {
            if (!value) return "Message is required"
            return null
        },
        acceptTerms: (value: boolean) => {
            if (!value) return locale === "de" ? "Bitte akzeptiere die Bedingungen." : "Please accept the terms."
            return null
        },
    }), [locale])

    const [inputs, validate] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values) => {
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

                    inputs.getInputProps("name").formValidation?.setValue("")
                    inputs.getInputProps("email").formValidation?.setValue("")
                    inputs.getInputProps("message").formValidation?.setValue("")
                    inputs.getInputProps("acceptTerms").formValidation?.setValue(false)
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

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold text-white">{labels.heading}</h1>
            <div className="flex flex-col gap-2 mt-6">
                <TextInput
                    placeholder={labels.namePlaceholder}
                    label={labels.nameLabel}
                    {...inputs.getInputProps("name")}
                />
            </div>
            <div className="flex flex-col gap-2">
                <EmailInput
                    placeholder={labels.emailPlaceholder}
                    label={labels.emailLabel}
                    {...inputs.getInputProps("email")}
                />
            </div>

            <div className="flex flex-col gap-2">
                <TextAreaInput
                    placeholder={labels.messagePlaceholder}
                    label={labels.messageLabel}
                    {...inputs.getInputProps("message")}
                />
            </div>

            <AcceptTermsCheckbox
                locale={locale}
                {...inputs.getInputProps("acceptTerms")}
            />

            <Button
                type="submit"
                variant="normal"
                className="mt-2 w-full! text-base!"
                onClick={() => {
                    trigger("heavy")
                    validate()
                }}
                disabled={isSubmitting || !inputs.isValid()}
            >
                {labels.submitLabel}
            </Button>
            {submitStatus && (
                <p className={submitStatus.type === "success" ? "mt-2 text-sm text-green-300" : "mt-2 text-sm text-red-300"}>
                    {submitStatus.message}
                </p>
            )}
        </div>
    )
}
