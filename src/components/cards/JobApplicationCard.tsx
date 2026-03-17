"use client"

import { Button, EmailInput, emailValidation, TextAreaInput, TextInput, useForm } from "@code0-tech/pictor"
import { useMemo, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface JobApplicationCardContent {
    applicationHeading: string
    applicationNameLabel: string
    applicationNamePlaceholder: string
    applicationEmailLabel: string
    applicationEmailPlaceholder: string
    applicationMessageLabel: string
    applicationMessagePlaceholder: string
    applicationSubmitLabel: string
}

interface JobApplicationCardProps {
    jobSlug: string
    content?: Partial<JobApplicationCardContent> | null
}

const defaultContent: JobApplicationCardContent = {
    applicationHeading: "Apply now",
    applicationNameLabel: "Name",
    applicationNamePlaceholder: "Your name",
    applicationEmailLabel: "Email",
    applicationEmailPlaceholder: "you@example.com",
    applicationMessageLabel: "Message",
    applicationMessagePlaceholder: "Tell us a bit about yourself...",
    applicationSubmitLabel: "Send application",
}

export function JobApplicationCard({ jobSlug, content }: JobApplicationCardProps) {
    const { trigger } = useWebHaptics()
    const labels = { ...defaultContent, ...content }
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error", message: string } | null>(null)
    const initialValues = useMemo(
        () => ({
            name: "",
            email: "",
            text: "",
        }),
        [],
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
        }),
        [],
    )

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
                    const response = await fetch(`/api/jobs/${encodeURIComponent(jobSlug)}`, {
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

                    inputs.getInputProps("name").formValidation?.setValue("")
                    inputs.getInputProps("email").formValidation?.setValue("")
                    inputs.getInputProps("text").formValidation?.setValue("")
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

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold text-white">{labels.applicationHeading}</h1>
            <div className="flex flex-col gap-2 mt-6">
                <TextInput
                    placeholder={labels.applicationNamePlaceholder}
                    label={labels.applicationNameLabel}
                    {...inputs.getInputProps("name")}
                />
            </div>
            <div className="flex flex-col gap-2">
                <EmailInput
                    placeholder={labels.applicationEmailPlaceholder}
                    label={labels.applicationEmailLabel}
                    {...inputs.getInputProps("email")}
                />
            </div>

            <div className="flex flex-col gap-2">
                <TextAreaInput
                    placeholder={labels.applicationMessagePlaceholder}
                    label={labels.applicationMessageLabel}
                    {...inputs.getInputProps("text")}
                />
            </div>

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
            {submitStatus && (
                <p className={submitStatus.type === "success" ? "mt-2 text-sm text-green-300" : "mt-2 text-sm text-red-300"}>
                    {submitStatus.message}
                </p>
            )}
        </div>
    )
}
