"use client"

import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox"
import type { CheckboxInputProps } from "@code0-tech/pictor/dist/components/form/CheckboxInput"

interface WithdrawalConsentCheckboxProps {
    disabled?: boolean
    formValidation?: CheckboxInputProps["formValidation"]
    text: string
}

export function WithdrawalConsentCheckbox({ disabled, formValidation, text }: WithdrawalConsentCheckboxProps) {
    return <ConsentCheckbox ariaLabel={text} disabled={disabled} formValidation={formValidation} initialValue={false} label={text} />
}
