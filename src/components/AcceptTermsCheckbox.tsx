"use client"

import { DEFAULT_LOCALE, type AppLocale, localizeHref } from "@/lib/i18n"
import { CheckboxInput, InputMessage } from "@code0-tech/pictor"
import type { CheckboxInputProps } from "@code0-tech/pictor/dist/components/form/CheckboxInput"
import Link from "next/link"
import type { ReactNode } from "react"
import { useWebHaptics } from "web-haptics/react"

interface AcceptTermsCheckboxProps extends Omit<CheckboxInputProps, "label"> {
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

export function AcceptTermsCheckbox({ locale = DEFAULT_LOCALE, className, revalidateOnToggle, ...checkboxProps }: AcceptTermsCheckboxProps) {
    const { trigger } = useWebHaptics()
    const { formValidation, ...rest } = checkboxProps

    const labels = copy[locale]
    const termsHref = localizeHref("/terms", locale)
    const privacyHref = localizeHref("/privacy", locale)

    const checkboxFormValidation = formValidation
        ? {
              ...formValidation,
              notValidMessage: null,
              setValue: (value: boolean) => {
                  formValidation.setValue?.(value)
                  if (!formValidation.valid) {
                      revalidateOnToggle?.()
                  }
              },
          }
        : undefined

    const label: ReactNode = (
        <span className="text-sm leading-6 text-white/80">
            {labels.labelStart}{" "}
            <Link
                href={termsHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trigger("medium")}
                className="font-medium text-white border-b-0 border-dashed border-brand hover:text-brand hover:border-b transition-all"
            >
                {labels.termsLabel}
            </Link>{" "}
            {labels.labelJoin}{" "}
            <Link
                href={privacyHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trigger("medium")}
                className="font-medium text-white border-b-0 border-dashed border-brand hover:text-brand hover:border-b transition-all"
            >
                {labels.privacyLabel}
            </Link>
            .
        </span>
    )

    return (
        <div className={className}>
            <div className="flex items-start">
                <CheckboxInput className="-mr-3" formValidation={checkboxFormValidation} {...rest} />
                {label}
            </div>
            {!formValidation?.valid && formValidation?.notValidMessage && <InputMessage>{formValidation.notValidMessage}</InputMessage>}
        </div>
    )
}
