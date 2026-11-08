"use client"

import { cn } from "@/lib/utils"
import { InputMessage } from "@code0-tech/pictor"
import type { CheckboxInputProps } from "@code0-tech/pictor/dist/components/form/CheckboxInput"
import { IconCheck } from "@tabler/icons-react"
import { type ReactNode, useState } from "react"

export interface ConsentCheckboxProps {
    ariaLabel: string
    className?: string
    disabled?: boolean
    formValidation?: CheckboxInputProps["formValidation"]
    initialValue?: boolean
    label: ReactNode
    revalidateOnToggle?: () => void
}

export function ConsentCheckbox({ ariaLabel, className, disabled, formValidation, initialValue = false, label, revalidateOnToggle }: ConsentCheckboxProps) {
    const [checked, setChecked] = useState(initialValue)

    const toggle = () => {
        if (disabled) return
        const nextChecked = !checked
        setChecked(nextChecked)
        formValidation?.setValue?.(nextChecked)
        if (formValidation && !formValidation.valid) revalidateOnToggle?.()
    }

    return (
        <div className={className}>
            <div className="flex items-start gap-2">
                <div className={cn("input checkbox-input mt-0.5 shrink-0", formValidation && !formValidation.valid && "input--not-valid")}>
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={ariaLabel}
                        className="checkbox-input__button"
                        data-state={checked ? "checked" : "unchecked"}
                        disabled={disabled}
                        onClick={toggle}
                    >
                        {checked ? <IconCheck aria-hidden="true" className="checkbox-input__indicator" size={16} /> : null}
                    </button>
                </div>
                <span className="text-sm leading-6 text-secondary">{label}</span>
            </div>
            {!formValidation?.valid && formValidation?.notValidMessage && <InputMessage>{formValidation.notValidMessage}</InputMessage>}
        </div>
    )
}
