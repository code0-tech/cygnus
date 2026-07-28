import type { ArrayField } from "payload"

interface ButtonFieldOptions {
    label?: string
    name?: string
    required?: boolean
}

export function buttonField(maxRows: number, { label = "Buttons", name = "buttons", required = false }: ButtonFieldOptions = {}): ArrayField {
    return {
        name,
        label,
        type: "array",
        required,
        maxRows,
        fields: [
            {
                name: "label",
                type: "text",
                required: true,
                localized: true,
            },
            {
                name: "url",
                type: "text",
                required: true,
            },
            {
                name: "variant",
                type: "select",
                required: false,
                defaultValue: "normal",
                options: [
                    { label: "None", value: "none" },
                    { label: "Normal", value: "normal" },
                    { label: "Outlined", value: "outlined" },
                    { label: "Filled", value: "filled" },
                ],
            },
        ],
    }
}
