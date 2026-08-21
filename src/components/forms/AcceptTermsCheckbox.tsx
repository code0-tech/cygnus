"use client"

import { DEFAULT_LOCALE, type AppLocale, localizeHref } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { InputMessage } from "@code0-tech/pictor"
import type { CheckboxInputProps } from "@code0-tech/pictor/dist/components/form/CheckboxInput"
import { IconCheck } from "@tabler/icons-react"
import Link from "next/link"
import { type ReactNode, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface AcceptTermsCheckboxProps {
    className?: string
    disabled?: boolean
    formValidation?: CheckboxInputProps["formValidation"]
    initialValue?: boolean
    locale?: AppLocale
    revalidateOnToggle?: () => void
}

const copy: Record<AppLocale, { labelStart: string; termsLabel: string; privacyLabel: string; labelJoin: string }> = {
    en: {
        labelStart: "I accept the",
        termsLabel: "Terms and Conditions",
        privacyLabel: "Privacy Policy",
        labelJoin: "and the",
    },
    de: {
        labelStart: "Ich akzeptiere die",
        termsLabel: "AGB",
        privacyLabel: "Datenschutzrichtlinie",
        labelJoin: "und die",
    },
}

export function AcceptTermsCheckbox({ locale = DEFAULT_LOCALE, className, disabled, formValidation, initialValue = false, revalidateOnToggle }: AcceptTermsCheckboxProps) {
    const { trigger } = useWebHaptics()
    const [checked, setChecked] = useState(initialValue)

    const labels = copy[locale]
    const termsHref = localizeHref("/terms", locale)
    const privacyHref = localizeHref("/privacy", locale)

    const toggle = () => {
        if (disabled) return
        const nextChecked = !checked
        setChecked(nextChecked)
        formValidation?.setValue?.(nextChecked)
        if (formValidation && !formValidation.valid) revalidateOnToggle?.()
    }

    const label: ReactNode = (
        <span className="text-sm leading-6 text-secondary">
            {labels.labelStart}{" "}
            <Link href={termsHref} target="_blank" rel="noopener noreferrer" onClick={() => trigger("medium")} className="font-medium text-white hover:text-brand transition-all">
                {labels.termsLabel}
            </Link>{" "}
            {labels.labelJoin}{" "}
            <Link href={privacyHref} target="_blank" rel="noopener noreferrer" onClick={() => trigger("medium")} className="font-medium text-white hover:text-brand transition-all">
                {labels.privacyLabel}
            </Link>
            .
        </span>
    )

    return (
        <div className={className}>
            <div className="flex items-start gap-2">
                <div className={cn("input checkbox-input mt-0.5 shrink-0", formValidation && !formValidation.valid && "input--not-valid")}>
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${labels.labelStart} ${labels.termsLabel} ${labels.labelJoin} ${labels.privacyLabel}`}
                        className="checkbox-input__button"
                        data-state={checked ? "checked" : "unchecked"}
                        disabled={disabled}
                        onClick={toggle}
                    >
                        {checked ? <IconCheck aria-hidden="true" className="checkbox-input__indicator" size={16} /> : null}
                    </button>
                </div>
                {label}
            </div>
            {!formValidation?.valid && formValidation?.notValidMessage && <InputMessage>{formValidation.notValidMessage}</InputMessage>}
        </div>
    )
}
