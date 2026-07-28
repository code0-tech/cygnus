"use client"

import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import type { AppLocale } from "@/lib/i18n"
import { Button, EmailInput, emailValidation, TextAreaInput, TextInput, useForm } from "@code0-tech/pictor"
import type { FocusEvent } from "react"
import { useMemo, useState } from "react"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

interface JobApplicationFormContent {
    applicationHeading: string
    applicationNameLabel: string
    applicationNamePlaceholder: string
    applicationEmailLabel: string
    applicationEmailPlaceholder: string
    applicationMessageLabel: string
    applicationMessagePlaceholder: string
    applicationSubmitLabel: string
}

interface JobApplicationFormProps {
    jobSlug: string
    content?: Partial<JobApplicationFormContent> | null
    locale: AppLocale
}

interface JobApplicationFormValues {
    name: string
    email: string
    text: string
    acceptTerms: boolean
}

const defaultContent: JobApplicationFormContent = {
    applicationHeading: "Apply now",
    applicationNameLabel: "Name",
    applicationNamePlaceholder: "Your name",
    applicationEmailLabel: "Email",
    applicationEmailPlaceholder: "you@example.com",
    applicationMessageLabel: "Message",
    applicationMessagePlaceholder: "Tell us a bit about yourself...",
    applicationSubmitLabel: "Send application",
}

export function JobApplicationForm({ jobSlug, content, locale }: JobApplicationFormProps) {
    const { trigger } = useWebHaptics()
    const labels = { ...defaultContent, ...content }
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const initialValues = useMemo<JobApplicationFormValues>(
        () => ({
            name: "",
            email: "",
            text: "",
            acceptTerms: false,
        }),
        []
    )

    const validation = useMemo(
        () => ({
            name: (value: string) => {
                if (!value) return "Name is required"
                return null
            },
            email: (value: string) => {
                if (!value) return "Email is required"
                if (!emailValidation(value)) return "Please provide a valid email"
                return null
            },
            text: (value: string) => {
                if (!value) return "Message is required"
                return null
            },
            acceptTerms: (value: boolean) => {
                if (!value) return locale === "de" ? "Bitte akzeptiere die Bedingungen." : "Please accept the terms."
                return null
            },
        }),
        [locale]
    )

    const [inputs, validate] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: JobApplicationFormValues) => {
            if (isSubmitting) return

            setIsSubmitting(true)
            setSubmitStatus(null)

            void (async () => {
                try {
                    const response = await fetch(`/api/job-applications/${encodeURIComponent(jobSlug)}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(values),
                    })

                    if (!response.ok) {
                        const errorText = await response.text().catch(() => "")
                        throw new Error(errorText || "Failed to send application.")
                    }

                    inputs.getInputProps("name").formValidation?.setValue?.("")
                    inputs.getInputProps("email").formValidation?.setValue?.("")
                    inputs.getInputProps("text").formValidation?.setValue?.("")
                    inputs.getInputProps("acceptTerms").formValidation?.setValue?.(false)
                    setSubmitStatus({ type: "success", message: "Application sent successfully." })
                } catch (error) {
                    console.error("Job application submit error:", error)
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
    const textInputProps = inputs.getInputProps("text")
    const acceptTermsInputProps = inputs.getInputProps("acceptTerms")

    return (
        <Card variant={"light"} size="lg" className="space-y-4 p-4 min-w-0">
            <h1 className="text-4xl font-semibold text-white mb-4">{labels.applicationHeading}</h1>
            <TextInput
                maxLength={100}
                placeholder={labels.applicationNamePlaceholder}
                label={labels.applicationNameLabel}
                onChange={() => {
                    if (!nameInputProps.formValidation?.valid) {
                        validate("name")
                    }
                }}
                {...nameInputProps}
            />
            <EmailInput
                maxLength={254}
                placeholder={labels.applicationEmailPlaceholder}
                label={labels.applicationEmailLabel}
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
                placeholder={labels.applicationMessagePlaceholder}
                label={labels.applicationMessageLabel}
                onChange={() => {
                    if (!textInputProps.formValidation?.valid) {
                        validate("text")
                    }
                }}
                {...textInputProps}
            />
            <AcceptTermsCheckbox locale={locale} revalidateOnToggle={() => validate("acceptTerms")} {...acceptTermsInputProps} />
            <Button
                type="submit"
                variant="normal"
                className="mt-2 w-full! text-base!"
                onClick={() => {
                    trigger("heavy")
                    validate()
                }}
                disabled={isSubmitting}
            >
                {labels.applicationSubmitLabel}
            </Button>
            {submitStatus && <p className={submitStatus.type === "success" ? "mt-2 text-sm text-green-300" : "mt-2 text-sm text-red-300"}>{submitStatus.message}</p>}
        </Card>
    )
}
