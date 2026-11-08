"use client"

import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox"
import { DEFAULT_LOCALE, type AppLocale, localizeHref } from "@/lib/i18n"
import type { CheckboxInputProps } from "@code0-tech/pictor/dist/components/form/CheckboxInput"
import Link from "next/link"
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

export function AcceptTermsCheckbox({ locale = DEFAULT_LOCALE, ...props }: AcceptTermsCheckboxProps) {
    const { trigger } = useWebHaptics()
    const labels = copy[locale]

    return (
        <ConsentCheckbox
            {...props}
            ariaLabel={`${labels.labelStart} ${labels.termsLabel} ${labels.labelJoin} ${labels.privacyLabel}`}
            label={
                <>
                    {labels.labelStart}{" "}
                    <Link href={localizeHref("/terms", locale)} target="_blank" rel="noopener noreferrer" onClick={() => trigger("medium")} className="font-medium text-white hover:text-brand transition-all">
                        {labels.termsLabel}
                    </Link>{" "}
                    {labels.labelJoin}{" "}
                    <Link href={localizeHref("/privacy", locale)} target="_blank" rel="noopener noreferrer" onClick={() => trigger("medium")} className="font-medium text-white hover:text-brand transition-all">
                        {labels.privacyLabel}
                    </Link>
                    .
                </>
            }
        />
    )
}
