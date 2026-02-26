"use client"

import { Button, EmailInput, emailValidation, Input, TextInput, useForm } from "@code0-tech/pictor"
import { useState } from "react"

interface ContactCardContent {
    heading: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    submitLabel: string
}

interface ContactCardProps {
    content?: Partial<ContactCardContent> | null
}

const defaultContent: ContactCardContent = {
    heading: "Contact us",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    messageLabel: "Message",
    messagePlaceholder: "How can we help you?",
    submitLabel: "Send message",
}

export function ContactCard({ content }: ContactCardProps) {
    const labels = { ...defaultContent, ...content }
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error", message: string } | null>(null)

    const [inputs, validate] = useForm({
        initialValues: {
            name: "",
            email: "",
            message: ""
        },
        validate: {
            name: (value) => {
                if (!value) return "Name is required"
                return null
            },
            email: (value) => {
                if (!value) return "Email is required"
                if (!emailValidation(value)) return "Please provide a valid email"
                return null
            },
            message: (value) => {
                if (!value) return "Message is required"
                return null
            }
        },
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
        }
    })

    return (
        <div className="flex flex-col">
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
                <Input
                    placeholder={labels.messagePlaceholder}
                    label={labels.messageLabel}
                    {...inputs.getInputProps("message")}
                />
            </div>

            <Button
                type="submit"
                variant="normal"
                className="mt-2 w-full! text-base!"
                onClick={validate}
                disabled={isSubmitting}
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
